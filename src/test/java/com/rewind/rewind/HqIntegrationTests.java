package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import com.rewind.rewind.profile.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class HqIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired AdminUserService adminUsers;
    @Autowired ProfileService profiles;

    @Test
    @Transactional
    void adminCanAssignPublicHqStatus() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "hq-" + suffix + "@example.invalid";
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("hq_" + suffix);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        assertFalse(profiles.publicProfile(userId).hq());
        assertTrue(adminUsers.setHq(userId, true).getIsHq());
        assertTrue(profiles.publicProfile(userId).hq());
        assertFalse(adminUsers.setHq(userId, false).getIsHq());
    }
}
