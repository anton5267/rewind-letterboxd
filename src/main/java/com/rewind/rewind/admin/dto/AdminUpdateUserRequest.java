package com.rewind.rewind.admin.dto;

import jakarta.validation.constraints.Size;

public class AdminUpdateUserRequest {

    @Size(min = 3, max = 50)
    private String username;      // optional

    @Size(max = 60)
    private String displayName;   // optional

    private String avatarUrl;     // optional

    // "USER" або "ADMIN" (як у твоєму enum UserRole)
    private String role;          // optional

    private Boolean isActive;     // optional

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
