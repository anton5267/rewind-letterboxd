package com.rewind.rewind;

import com.rewind.rewind.admin.settings.dto.AdminSettingUpdateRequest;
import com.rewind.rewind.admin.settings.service.AdminSiteSettingsService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class AdminSettingsIntegrationTests {
    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired AdminSiteSettingsService settings;

    @Test
    @Transactional
    void adminCanUpdateWhitelistedSettingAndInvalidValuesAreRejected() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("settings_admin_" + suffix);
        request.setEmail("settings_admin_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);
        users.findByEmail(request.getEmail()).orElseThrow().setRole(UserRole.ADMIN);

        var updated = settings.update("maintenance_mode", new AdminSettingUpdateRequest("true"), request.getEmail());
        assertEquals("true", updated.value());
        assertEquals("true", settings.list().stream().filter(item -> item.key().equals("maintenance_mode")).findFirst().orElseThrow().value());
        assertThrows(IllegalArgumentException.class, () -> settings.update("unknown", new AdminSettingUpdateRequest("x"), request.getEmail()));
        assertThrows(IllegalArgumentException.class, () -> settings.update("maintenance_mode", new AdminSettingUpdateRequest("yes"), request.getEmail()));
    }
}
