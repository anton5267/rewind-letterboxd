package com.rewind.rewind.user.dto;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;

    public UserResponse(Long id, String username, String email, String role, String avatarUrl) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getAvatarUrl() { return avatarUrl; }
}
