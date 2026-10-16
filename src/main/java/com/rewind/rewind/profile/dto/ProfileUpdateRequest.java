package com.rewind.rewind.profile.dto;

import jakarta.validation.constraints.Size;

public class ProfileUpdateRequest {

    @Size(min = 2, max = 60)
    private String displayName;

    @Size(max = 255)
    private String avatarUrl;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
