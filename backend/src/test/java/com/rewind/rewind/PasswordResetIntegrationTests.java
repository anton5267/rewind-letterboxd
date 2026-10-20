package com.rewind.rewind;

import com.rewind.rewind.auth.PasswordResetService;
import com.rewind.rewind.auth.RefreshSessionService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PasswordResetIntegrationTests {
    @Autowired PasswordResetService reset;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired RefreshSessionService sessions;
    @Autowired MockMvc mockMvc;
    @MockitoBean JavaMailSender mail;

    @Test
    void resetTokenIsSingleUseAndUnknownEmailGetsSameResponse() {
        String email = "reset-" + UUID.randomUUID() + "@example.invalid";
        User user = new User();
        user.setUsername("reset" + UUID.randomUUID().toString().substring(0, 10));
        user.setEmail(email);
        user.setPasswordHash(passwords.encode("OldPassword123!"));
        users.saveAndFlush(user);

        reset.request("missing@example.invalid");
        verify(mail, never()).send(any(SimpleMailMessage.class));

        reset.request(email);
        var captured = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(captured.capture());
        String body = captured.getValue().getText();
        assertNotNull(body);
        assertTrue(body.contains("/uk/reset-password?token="));
        String token = body.split("token=")[1].split("\\s")[0];

        var previousSession = sessions.issue(email);
        reset.reset(token, "NewPassword123!");
        users.flush();
        assertTrue(passwords.matches("NewPassword123!", users.findByEmail(email).orElseThrow().getPasswordHash()));
        assertThrows(ResponseStatusException.class, () -> sessions.refresh(previousSession.refresh()));
        assertThrows(ResponseStatusException.class, () -> reset.reset(token, "AnotherPassword123!"));
    }

    @Test
    void inactiveUserCannotUsePreviouslyIssuedResetToken() {
        String email = "reset-inactive-" + UUID.randomUUID() + "@example.invalid";
        User user = new User();
        user.setUsername("resetinactive" + UUID.randomUUID().toString().substring(0, 10));
        user.setEmail(email);
        user.setPasswordHash(passwords.encode("OldPassword123!"));
        users.saveAndFlush(user);

        reset.request(email);
        var captured = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(captured.capture());
        String token = captured.getValue().getText().split("token=")[1].split("\\s")[0];

        user.setIsActive(false);
        users.flush();

        assertThrows(ResponseStatusException.class, () -> reset.reset(token, "NewPassword123!"));
    }

    @Test
    void passwordWritingEndpointsValidateBytesAndKeepLegacyLoginAndSessionContracts() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "password-http-" + suffix + "@example.invalid";
        String oversized = "ї".repeat(37);
        String boundary = "ї".repeat(36);
        String resetPassword = "a".repeat(72);

        jsonRequest(post("/api/auth/register"), """
                {"username":"invalid_%s","email":"invalid-%s@example.invalid","password":"%s"}
                """.formatted(suffix, suffix, oversized))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("password:")));
        assertTrue(users.findByEmail("invalid-" + suffix + "@example.invalid").isEmpty());

        jsonRequest(post("/api/auth/register"), """
                {"username":"password_%s","email":"%s","password":"legacy"}
                """.formatted(suffix, email)).andExpect(status().isOk());
        MvcResult legacyLogin = jsonRequest(post("/api/auth/login"), """
                {"email":"%s","password":"legacy"}
                """.formatted(email)).andExpect(status().isOk()).andReturn();
        Cookie access = responseCookie(legacyLogin, "rewind_access");
        Cookie legacyRefresh = responseCookie(legacyLogin, "rewind_refresh");

        jsonRequest(put("/api/profile/me/password"), """
                {"currentPassword":"legacy","newPassword":"%s"}
                """.formatted(oversized), access)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("newPassword:")));
        assertTrue(passwords.matches("legacy", users.findByEmail(email).orElseThrow().getPasswordHash()));

        jsonRequest(put("/api/profile/me/password"), """
                {"currentPassword":"legacy","newPassword":"%s"}
                """.formatted(boundary), access).andExpect(status().isOk());
        jsonRequest(post("/api/auth/refresh"), "{}", legacyRefresh).andExpect(status().isUnauthorized());
        MvcResult changedLogin = jsonRequest(post("/api/auth/login"), """
                {"email":"%s","password":"%s"}
                """.formatted(email, boundary)).andExpect(status().isOk()).andReturn();

        jsonRequest(post("/api/auth/forgot-password"), """
                {"email":"%s"}
                """.formatted(email)).andExpect(status().isAccepted());
        var captured = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(captured.capture());
        String token = captured.getValue().getText().split("token=")[1].split("\\s")[0];
        jsonRequest(post("/api/auth/reset-password"), """
                {"token":"%s","newPassword":"%s"}
                """.formatted(token, oversized))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("newPassword:")));
        assertTrue(passwords.matches(boundary, users.findByEmail(email).orElseThrow().getPasswordHash()));

        jsonRequest(post("/api/auth/reset-password"), """
                {"token":"%s","newPassword":"%s"}
                """.formatted(token, resetPassword)).andExpect(status().isNoContent());
        jsonRequest(post("/api/auth/login"), """
                {"email":"%s","password":"%s"}
                """.formatted(email, resetPassword)).andExpect(status().isOk());
        jsonRequest(post("/api/auth/login"), """
                {"email":"%s","password":"%s"}
                """.formatted(email, boundary)).andExpect(status().isUnauthorized());
        jsonRequest(post("/api/auth/refresh"), "{}", responseCookie(changedLogin, "rewind_refresh"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions jsonRequest(MockHttpServletRequestBuilder request, String json, Cookie... authentication) throws Exception {
        MvcResult bootstrap = mockMvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        Cookie csrf = responseCookie(bootstrap, "XSRF-TOKEN");
        var cookies = new ArrayList<>(List.of(authentication));
        cookies.add(csrf);
        return mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(json)
                .cookie(cookies.toArray(Cookie[]::new)).header("X-XSRF-TOKEN", csrf.getValue()));
    }

    private Cookie responseCookie(MvcResult result, String name) {
        return result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(value -> value.startsWith(name + "="))
                .map(value -> new Cookie(name, value.substring(name.length() + 1).split(";", 2)[0]))
                .findFirst().orElseThrow(() -> new AssertionError("Expected response cookie " + name));
    }
}
