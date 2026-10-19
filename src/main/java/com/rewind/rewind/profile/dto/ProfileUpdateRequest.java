package com.rewind.rewind.profile.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ProfileUpdateRequest {

    @Size(max = 60)
    @Pattern(regexp = "^$|(?=.{2,60}$)(?=.*\\S).*$", message = "Display name must be empty or at least 2 non-blank characters")
    private String displayName;

    @Size(max = 255)
    @Pattern(regexp = "^$|https?://\\S+$", message = "Avatar URL must use http or https")
    private String avatarUrl;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
