package com.rewind.rewind;

import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
class CsrfLifecycleIntegrationTests {
    private static final String PASSWORD = "csrf-test-password-123";
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;
    private Long userId;
    private String email;

    @BeforeEach
    void createCommittedFixtureVisibleToConcurrentRequests() {
        String suffix = UUID.randomUUID().toString().substring(0, 12);
        email = "csrf-" + suffix + "@example.invalid";
        User user = new User();
        user.setUsername("csrf_" + suffix);
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(PASSWORD));
        userId = users.saveAndFlush(user).getId();
    }

    @AfterEach
    void deleteOnlyOwnedFixtureAndItsCascadedSessions() {
        if (userId == null) return;
        jdbc.update("delete from users where id = ? and email = ?", userId, email);
        assertEquals(0L, jdbc.queryForObject("select count(*) from users where id = ?", Long.class, userId));
        assertEquals(0L, jdbc.queryForObject("select count(*) from refresh_sessions where user_id = ?", Long.class, userId));
    }

    @Test
    void successfulLoginAndLogoutRenewCsrfButFailedLoginDoesNot() throws Exception {
        Cookie anonymousCsrf = bootstrap();
        MvcResult failed = perform(post("/api/auth/login").content(loginJson("incorrect")),
                anonymousCsrf, null, null);
        assertStatus(failed, 401);
        assertNoCsrfCookie(failed);

        MvcResult login = perform(post("/api/auth/login").content(loginJson(PASSWORD)), anonymousCsrf, null, null);
        assertStatus(login, 200);
        Cookie authenticatedCsrf = cookie(login, "XSRF-TOKEN");
        assertTrue(!anonymousCsrf.getValue().equals(authenticatedCsrf.getValue()), "Login must renew CSRF cookie");
        Cookie access = cookie(login, "rewind_access");
        Cookie refresh = cookie(login, "rewind_refresh");
        assertEquals("/", authenticatedCsrf.getPath());
        assertFalse(authenticatedCsrf.isHttpOnly());
        assertEquals("/api", access.getPath());
        assertEquals("/api/auth", refresh.getPath());
        assertTrue(access.isHttpOnly());
        assertTrue(refresh.isHttpOnly());
        assertTrue(access.getSecure());
        assertTrue(refresh.getSecure());

        MvcResult staleHeader = mockMvc.perform(patch("/api/profile/me")
                .contentType(MediaType.APPLICATION_JSON).content("{\"displayName\":\"Rejected\"}")
                .cookie(access, authenticatedCsrf).header("X-XSRF-TOKEN", anonymousCsrf.getValue())).andReturn();
        assertStatus(staleHeader, 403);
        assertNoCsrfCookie(staleHeader);

        MvcResult logout = perform(post("/api/auth/logout"), authenticatedCsrf, access, refresh);
        assertStatus(logout, 204);
        Cookie loggedOutCsrf = cookie(logout, "XSRF-TOKEN");
        assertTrue(!authenticatedCsrf.getValue().equals(loggedOutCsrf.getValue()), "Logout must renew CSRF cookie");
        assertEquals(0, cookie(logout, "rewind_access").getMaxAge());
        assertEquals(0, cookie(logout, "rewind_refresh").getMaxAge());
        MvcResult revoked = perform(post("/api/auth/refresh"), loggedOutCsrf, null, refresh);
        assertStatus(revoked, 401);
        assertNoCsrfCookie(revoked);
        assertStatus(perform(get("/api/users/me"), loggedOutCsrf, null, null), 401);
    }

    @Test
    void ordinaryAuthenticatedReadsAndWritesKeepCsrfCookieStable() throws Exception {
        BrowserSession session = login();
        for (String path : List.of("/api/users/me", "/api/profile/me", "/api/auth/csrf")) {
            MvcResult read = perform(get(path), session.csrf(), session.access(), null);
            assertStatus(read, 200);
            assertNoCsrfCookie(read);
        }
        for (int index = 0; index < 2; index++) {
            MvcResult write = perform(patch("/api/profile/me")
                    .content("{\"displayName\":\"Stable " + index + "\"}"), session.csrf(), session.access(), null);
            assertStatus(write, 200);
            assertNoCsrfCookie(write);
        }
        assertEquals("Stable 1", users.findById(userId).orElseThrow().getDisplayName());
    }

    @Test
    void concurrentReadsAndWritesCannotRotateCookieUnderAPendingMutation() throws Exception {
        BrowserSession session = login();
        ExecutorService executor = Executors.newFixedThreadPool(6);
        try {
            for (int round = 0; round < 4; round++) {
                CountDownLatch start = new CountDownLatch(1);
                List<Future<MvcResult>> results = new ArrayList<>();
                for (int index = 0; index < 6; index++) {
                    final int task = index;
                    results.add(executor.submit(() -> {
                        assertTrue(start.await(10, TimeUnit.SECONDS), "Concurrent requests must start");
                        MockHttpServletRequestBuilder request = task == 5
                                ? patch("/api/profile/me").content("{\"displayName\":\"Concurrent fixture\"}")
                                : get(task % 2 == 0 ? "/api/users/me" : "/api/auth/csrf");
                        return perform(request, session.csrf(), session.access(), null);
                    }));
                }
                start.countDown();
                for (Future<MvcResult> result : results) {
                    MvcResult response = result.get(20, TimeUnit.SECONDS);
                    assertStatus(response, 200);
                    assertNoCsrfCookie(response);
                }
                // A mutation prepared before the GET burst must still match the browser cookie afterwards.
                MvcResult pending = perform(patch("/api/profile/me")
                        .content("{\"displayName\":\"After concurrent requests\"}"), session.csrf(), session.access(), null);
                assertStatus(pending, 200);
                assertNoCsrfCookie(pending);
            }
        } finally {
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS), "Workers must stop before fixture cleanup");
        }
    }

    @Test
    void missingInvalidAndMismatchedCsrfStillRejectUnsafeRequestsAndPreserveAuthorization() throws Exception {
        BrowserSession session = login();
        for (String method : List.of("PATCH", "DELETE")) {
            String body = method.equals("PATCH") ? "{\"displayName\":\"Rejected\"}"
                    : "{\"currentPassword\":\"" + PASSWORD + "\"}";
            for (String token : List.of("", "invalid-csrf")) {
                MockHttpServletRequestBuilder request = request(org.springframework.http.HttpMethod.valueOf(method), "/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON).content(body).cookie(session.access(), session.csrf());
                if (!token.isEmpty()) request.header("X-XSRF-TOKEN", token);
                assertStatus(mockMvc.perform(request).andReturn(), 403);
            }
        }
        assertStatus(mockMvc.perform(post("/api/auth/logout").cookie(session.access(), session.csrf())).andReturn(), 403);
        assertStatus(mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(PASSWORD)).cookie(session.csrf())).andReturn(), 403);
        assertStatus(mockMvc.perform(patch("/api/profile/me").contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Rejected\"}").cookie(session.access())
                .header("X-XSRF-TOKEN", session.csrf().getValue())).andReturn(), 403);
        assertTrue(users.existsById(userId), "Rejected DELETE must not remove fixture");
        assertNull(users.findById(userId).orElseThrow().getDisplayName());
        assertStatus(perform(get("/api/admin/users"), session.csrf(), session.access(), null), 403);
        assertStatus(perform(patch("/api/profile/me").content("{}"), session.csrf(), null, null), 401);
        jdbc.update("update users set is_active = false where id = ?", userId);
        assertStatus(perform(get("/api/users/me"), session.csrf(), session.access(), null), 401);
    }

    @Test
    void refreshKeepsCsrfStableWhileRotatingAndRevokingRefreshCredentials() throws Exception {
        BrowserSession session = login();
        MvcResult refreshed = perform(post("/api/auth/refresh"), session.csrf(), session.access(), session.refresh());
        assertStatus(refreshed, 204);
        assertNoCsrfCookie(refreshed);
        Cookie nextAccess = cookie(refreshed, "rewind_access");
        Cookie nextRefresh = cookie(refreshed, "rewind_refresh");
        assertTrue(!session.refresh().getValue().equals(nextRefresh.getValue()), "Refresh credentials must rotate");
        MvcResult mutation = perform(patch("/api/profile/me").content("{\"displayName\":\"Refreshed fixture\"}"),
                session.csrf(), nextAccess, null);
        assertStatus(mutation, 200);
        assertNoCsrfCookie(mutation);
        MvcResult replay = perform(post("/api/auth/refresh"), session.csrf(), null, session.refresh());
        assertStatus(replay, 401);
        assertNoCsrfCookie(replay);
        assertStatus(perform(post("/api/auth/refresh"), session.csrf(), null, nextRefresh), 401);
    }

    private BrowserSession login() throws Exception {
        MvcResult result = perform(post("/api/auth/login").content(loginJson(PASSWORD)), bootstrap(), null, null);
        assertStatus(result, 200);
        return new BrowserSession(cookie(result, "XSRF-TOKEN"), cookie(result, "rewind_access"), cookie(result, "rewind_refresh"));
    }

    private Cookie bootstrap() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf")).andReturn();
        assertStatus(result, 200);
        return cookie(result, "XSRF-TOKEN");
    }

    private MvcResult perform(MockHttpServletRequestBuilder request, Cookie csrf, Cookie access, Cookie refresh) throws Exception {
        List<Cookie> cookies = new ArrayList<>(List.of(csrf));
        if (access != null) cookies.add(access);
        if (refresh != null) cookies.add(refresh);
        MvcResult result = mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON)
                .cookie(cookies.toArray(Cookie[]::new)).header("X-XSRF-TOKEN", csrf.getValue())).andReturn();
        assertNull(result.getRequest().getSession(false), "Stateless JWT requests must not create an HTTP session");
        assertTrue(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .noneMatch(value -> value.startsWith("JSESSIONID=")), "No servlet-session cookie may be issued");
        return result;
    }

    private String loginJson(String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private void assertStatus(MvcResult result, int expected) {
        assertEquals(expected, result.getResponse().getStatus());
        assertNull(result.getRequest().getSession(false), "Requests must remain stateless");
    }

    private void assertNoCsrfCookie(MvcResult result) {
        assertTrue(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .noneMatch(value -> value.startsWith("XSRF-TOKEN=")), "Ordinary requests must not replace CSRF cookie");
    }

    private Cookie cookie(MvcResult result, String name) {
        Cookie cookie = result.getResponse().getCookie(name);
        if (cookie != null) return cookie;
        String header = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(value -> value.startsWith(name + "=")).findFirst()
                .orElseThrow(() -> new AssertionError("Expected response cookie " + name));
        return org.springframework.mock.web.MockCookie.parse(header);
    }

    private record BrowserSession(Cookie csrf, Cookie access, Cookie refresh) {}
}
