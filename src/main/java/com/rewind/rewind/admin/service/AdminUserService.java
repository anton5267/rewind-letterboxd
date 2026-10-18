package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminUpdateUserRequest;
import com.rewind.rewind.admin.dto.AdminUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;

@Service
public class AdminUserService {

    private final UserRepository users;
    private final AdminAuditLogService audit;

    public AdminUserService(UserRepository users, AdminAuditLogService audit) {
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> list(String q, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "id"));

        Page<User> p;
        if (q == null || q.isBlank()) {
            p = users.findAll(pageable);
        } else {
            p = users.findAllByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                    q, q, q, pageable
            );
        }

        return p.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse get(Long id) {
        return toDto(users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found")));
    }

    @Transactional
    public AdminUserResponse update(Long id, AdminUpdateUserRequest req) {
        return update(id, req, null);
    }

    @Transactional
    public AdminUserResponse update(Long id, AdminUpdateUserRequest req, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        guardAdminAccountChange(u, req.getIsActive(), req.getRole(), adminEmail);

        if (req.getUsername() != null) u.setUsername(req.getUsername());
        if (req.getDisplayName() != null) u.setDisplayName(req.getDisplayName());
        if (req.getAvatarUrl() != null) u.setAvatarUrl(req.getAvatarUrl());
        if (req.getIsActive() != null) u.setIsActive(req.getIsActive());

        if (req.getRole() != null) {
            try {
                u.setRole(UserRole.valueOf(req.getRole()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid role. Use USER or ADMIN");
            }
        }

        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_UPDATED", "USER", id, null);
        return toDto(u);
    }

    @Transactional
    public void deactivate(Long id) {
        deactivate(id, null);
    }

    @Transactional
    public void deactivate(Long id, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        guardAdminAccountChange(u, false, null, adminEmail);
        u.setIsActive(false);
        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_DEACTIVATED", "USER", id, null);
    }

    @Transactional
    public void activate(Long id) {
        activate(id, null);
    }

    @Transactional
    public void activate(Long id, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setIsActive(true);
        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_ACTIVATED", "USER", id, null);
    }

    private AdminUserResponse toDto(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getUsername(),
                u.getDisplayName(),
                u.getEmail(),
                u.getRole().name(),
                u.getAvatarUrl(),
                u.getIsActive(),
                u.getIsHq(),
                u.getCreatedAt()
        );
    }

    private void guardAdminAccountChange(User target, Boolean requestedActive, String requestedRole, String adminEmail) {
        boolean self = adminEmail != null && adminEmail.equalsIgnoreCase(target.getEmail());
        boolean deactivating = Boolean.FALSE.equals(requestedActive);
        boolean demoting = requestedRole != null && UserRole.USER.name().equalsIgnoreCase(requestedRole.trim());
        if (self && (deactivating || demoting)) {
            throw new IllegalArgumentException("Administrators cannot deactivate or demote their own account");
        }
        boolean removingAdminPrivileges = target.getRole() == UserRole.ADMIN && (deactivating || demoting);
        if (Boolean.TRUE.equals(target.getIsActive())
                && removingAdminPrivileges
                && users.findAllByRoleAndIsActiveTrue(UserRole.ADMIN).size() <= 1) {
            throw new IllegalArgumentException("At least one active administrator is required");
        }
    }

    @Transactional
    public AdminUserResponse setHq(Long id, boolean hq) { return setHq(id, hq, null); }

    @Transactional
    public AdminUserResponse setHq(Long id, boolean hq, String adminEmail) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setIsHq(hq);
        users.save(user);
        if (adminEmail != null) audit.record(adminEmail, hq ? "HQ_GRANTED" : "HQ_REVOKED", "USER", id, null);
        return toDto(user);
    }
}
