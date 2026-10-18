package com.rewind.rewind;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.audit.repo.AdminAuditLogRepository;
import com.rewind.rewind.admin.dto.AdminUpdateUserRequest;
import com.rewind.rewind.admin.service.AdminDashboardService;
import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminAuditIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired AdminUserService adminUsers;
    @Autowired AdminAuditLogService audit;
    @Autowired AdminAuditLogRepository auditRepository;
    @Autowired AdminDashboardService dashboard;
    @Autowired JdbcTemplate jdbc;

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
        adminUsers.deactivate(targetId, adminEmail);
        assertFalse(userRepository.findById(targetId).orElseThrow().getIsActive());
        adminUsers.activate(targetId, adminEmail);
        assertTrue(userRepository.findById(targetId).orElseThrow().getIsActive());
        assertTrue(dashboard.summary().users() >= 2);
    }

    @Test
    @Transactional
    void auditPagesAreStableWhenCreatedAtTies() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "audit-pages-" + suffix + "@example.invalid";
        register("audit_pages_" + suffix, adminEmail);
        Long adminId = userRepository.findByEmail(adminEmail).orElseThrow().getId();

        for (int index = 0; index < 51; index++) {
            audit.record(adminEmail, "FIXTURE_" + index, "TEST", (long) index, null);
        }
        auditRepository.flush();
        jdbc.update("UPDATE admin_audit_logs SET created_at = ? WHERE admin_id = ?", Instant.parse("2030-01-01T00:00:00Z"), adminId);

        List<Long> expectedIds = jdbc.queryForList(
                "SELECT id FROM admin_audit_logs WHERE admin_id = ? ORDER BY id DESC", Long.class, adminId);
        Set<Long> actualIds = new HashSet<>();
        audit.list(0, 50).forEach(item -> { if (expectedIds.contains(item.id())) actualIds.add(item.id()); });
        audit.list(1, 50).forEach(item -> { if (expectedIds.contains(item.id())) actualIds.add(item.id()); });

        assertEquals(51, expectedIds.size());
        assertEquals(new HashSet<>(expectedIds), actualIds, "Audit pages must expose every tied record exactly once");
    }

    @Test
    @Transactional
    void adminGuardPreventsSelfRemovalAndRemovingTheLastActiveAdmin() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String actorEmail = "guard-actor-" + suffix + "@example.invalid";
        String targetEmail = "guard-target-" + suffix + "@example.invalid";
        register("guard_actor_" + suffix, actorEmail);
        register("guard_target_" + suffix, targetEmail);

        User actor = userRepository.findByEmail(actorEmail).orElseThrow();
        User target = userRepository.findByEmail(targetEmail).orElseThrow();
        actor.setRole(UserRole.ADMIN);
        target.setRole(UserRole.ADMIN);
        actor.setIsActive(false);
        userRepository.flush();

        AdminUpdateUserRequest selfDemotion = new AdminUpdateUserRequest();
        selfDemotion.setRole("USER");
        assertThrows(IllegalArgumentException.class,
                () -> adminUsers.update(actor.getId(), selfDemotion, actorEmail));
        assertThrows(IllegalArgumentException.class,
                () -> adminUsers.deactivate(actor.getId(), actorEmail));

        AdminUpdateUserRequest lastAdminDemotion = new AdminUpdateUserRequest();
        lastAdminDemotion.setRole("USER");
        assertThrows(IllegalArgumentException.class,
                () -> adminUsers.update(target.getId(), lastAdminDemotion, actorEmail));
        assertThrows(IllegalArgumentException.class,
                () -> adminUsers.deactivate(target.getId(), actorEmail));
        assertEquals(UserRole.ADMIN, userRepository.findById(target.getId()).orElseThrow().getRole());
        assertTrue(userRepository.findById(target.getId()).orElseThrow().getIsActive());
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username); request.setEmail(email); request.setPassword("test-password-123");
        users.register(request);
    }
}
