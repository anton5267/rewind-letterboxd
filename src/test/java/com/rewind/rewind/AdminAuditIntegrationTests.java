package com.rewind.rewind;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.service.AdminDashboardService;
import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminAuditIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired AdminUserService adminUsers;
    @Autowired AdminAuditLogService audit;
    @Autowired AdminDashboardService dashboard;

    @Test
    @Transactional
    void adminChangesAreAuditedAndDashboardCountsAreAvailable() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "audit-admin-" + suffix + "@example.invalid";
        String targetEmail = "audit-target-" + suffix + "@example.invalid";
        register("audit_admin_" + suffix, adminEmail);
        Long adminId = userRepository.findByEmail(adminEmail).orElseThrow().getId();
        userRepository.findById(adminId).orElseThrow().setRole(UserRole.ADMIN);
        register("audit_target_" + suffix, targetEmail);
        Long targetId = userRepository.findByEmail(targetEmail).orElseThrow().getId();

        adminUsers.setHq(targetId, true, adminEmail);
        assertTrue(audit.list(0, 20).getContent().stream().anyMatch(item -> item.targetId().equals(targetId) && item.action().equals("HQ_GRANTED")));
        assertTrue(dashboard.summary().users() >= 2);
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username); request.setEmail(email); request.setPassword("test-password-123");
        users.register(request);
    }
}
