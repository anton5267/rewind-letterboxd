package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminUpdateUserRequest;
import com.rewind.rewind.admin.dto.AdminUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserRepository users;

    public AdminUserService(UserRepository users) {
        this.users = users;
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
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));

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
        return toDto(u);
    }

    @Transactional
    public void deactivate(Long id) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setIsActive(false);
        users.save(u);
    }

    @Transactional
    public void activate(Long id) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setIsActive(true);
        users.save(u);
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

    @Transactional
    public AdminUserResponse setHq(Long id, boolean hq) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setIsHq(hq);
        users.save(user);
        return toDto(user);
    }
}
