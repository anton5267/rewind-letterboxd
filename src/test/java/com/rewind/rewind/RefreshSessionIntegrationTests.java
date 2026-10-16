package com.rewind.rewind;

import com.rewind.rewind.auth.RefreshSessionService;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RefreshSessionIntegrationTests {
    @Autowired UserService users;
    @Autowired RefreshSessionService sessions;
    @Autowired ProfileService profiles;

    @Test
    @Transactional
    void rotatingAndReplayingRefreshTokenRevokesSessionFamily() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "refresh-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("refresh_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        var first = sessions.issue(email);
        var second = sessions.refresh(first.refresh());
        assertNotEquals(first.refresh(), second.refresh());
        assertThrows(ResponseStatusException.class, () -> sessions.refresh(first.refresh()));
        assertThrows(ResponseStatusException.class, () -> sessions.refresh(second.refresh()));
    }

    @Test
    @Transactional
    void logoutRevokesRefreshToken() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "logout-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("logout_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        var tokens = sessions.issue(email);
        sessions.revoke(tokens.refresh());
        assertThrows(ResponseStatusException.class, () -> sessions.refresh(tokens.refresh()));
    }

    @Test
    @Transactional
    void changingPasswordRevokesRefreshTokens() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "password-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("password_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        var tokens = sessions.issue(email);
        ChangePasswordRequest change = new ChangePasswordRequest();
        change.setCurrentPassword("test-password-123");
        change.setNewPassword("new-test-password-123");
        profiles.changeMyPassword(email, change);
        assertThrows(ResponseStatusException.class, () -> sessions.refresh(tokens.refresh()));
    }
}
