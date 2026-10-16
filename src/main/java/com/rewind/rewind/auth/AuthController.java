package com.rewind.rewind.auth;

import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.dto.UserResponse;
import com.rewind.rewind.user.dto.UserLoginRequest;
import com.rewind.rewind.user.dto.UserLoginResponse;
import com.rewind.rewind.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService users;
    private final PasswordResetService passwords;
    private final RefreshSessionService sessions;
    private final boolean secureCookies;
    private final long accessMinutes;
    private final long refreshDays;

    public AuthController(UserService users, PasswordResetService passwords,
            RefreshSessionService sessions,
            @Value("${app.auth.cookie-secure}") boolean secureCookies,
            @Value("${app.jwt.expiration-minutes}") long accessMinutes,
            @Value("${app.auth.refresh-days}") long refreshDays) {
        this.users = users;
        this.passwords = passwords;
        this.sessions = sessions;
        this.secureCookies = secureCookies;
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        try {
            UserResponse created = users.register(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException ex) {
            // простий варіант: 400 + текст помилки
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLoginRequest request) {
        try {
            UserLoginResponse loggedIn = users.login(request);
            return withCookies(ResponseEntity.ok(), sessions.issue(loggedIn.getEmail()))
                    .body(loggedIn);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = "rewind_refresh", required = false) String token) {
        return withCookies(ResponseEntity.status(204), sessions.refresh(token)).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = "rewind_refresh", required = false) String token) {
        sessions.revoke(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("rewind_access", "", "/api", Duration.ZERO).toString(),
                        cookie("rewind_refresh", "", "/api/auth", Duration.ZERO).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwords.request(request.email());
        return ResponseEntity.accepted().body("If the account exists, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwords.reset(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity.BodyBuilder withCookies(ResponseEntity.BodyBuilder builder, RefreshSessionService.Tokens tokens) {
        return builder.header(HttpHeaders.SET_COOKIE,
                        cookie("rewind_access", tokens.access(), "/api", Duration.ofMinutes(accessMinutes)).toString(),
                        cookie("rewind_refresh", tokens.refresh(), "/api/auth", Duration.ofDays(refreshDays)).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store");
    }

    private ResponseCookie cookie(String name, String value, String path, Duration age) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path(path)
                .maxAge(age)
                .build();
    }
}
