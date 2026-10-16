package com.rewind.rewind.admin.dto;

import java.time.Instant;

public class AdminUserResponse {

    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String role;
    private String avatarUrl;
    private Boolean isActive;
    private Instant createdAt;

    public AdminUserResponse(Long id, String username, String displayName, String email, String role, String avatarUrl,
                             Boolean isActive, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.email = email;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getAvatarUrl() { return avatarUrl; }
    public Boolean getIsActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
}
