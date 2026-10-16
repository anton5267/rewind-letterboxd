package com.rewind.rewind.user.controller;

import com.rewind.rewind.user.dto.UserResponse;
import com.rewind.rewind.user.dto.PublicUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicUserResponse> getById(@PathVariable Long id) {
        return users.findById(id)
                .map(u -> new PublicUserResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        String email = auth.getName();

        return users.findByEmail(email)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole().name(),
                u.getAvatarUrl()
        );
    }
}
