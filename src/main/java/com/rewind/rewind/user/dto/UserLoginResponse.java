package com.rewind.rewind.user.dto;

public class UserLoginResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private String token; // поки буде null або заглушка

    public UserLoginResponse(Long id, String username, String email, String role, String token) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.token = token;
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }

    public String getEmail() { return email; }

    public String getRole() { return role; }

    public String getToken() { return token; }
}
