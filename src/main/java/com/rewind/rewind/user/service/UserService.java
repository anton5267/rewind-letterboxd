package com.rewind.rewind.user.service;

import com.rewind.rewind.user.dto.UserLoginRequest;
import com.rewind.rewind.user.dto.UserLoginResponse;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.dto.UserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.list.service.system.SystemListService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final SystemListService systemListService;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder, SystemListService systemListService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.systemListService = systemListService;
    }

    @Transactional
    public UserResponse register(UserRegisterRequest request) {
        if (users.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (users.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setDisplayName(request.getUsername());


        User saved = users.save(user);
        systemListService.ensureDefaultLists(saved);


        return new UserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.getAvatarUrl()
        );
    }

    public UserLoginResponse login(UserLoginRequest request) {
        var user = users.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatches || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return new UserLoginResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );
    }
    public Long requireUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = String.valueOf(principal);

        return users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }
}
