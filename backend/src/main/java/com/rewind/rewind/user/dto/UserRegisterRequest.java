package com.rewind.rewind.user.dto;

import com.rewind.rewind.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserRegisterRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @NotBlank
    @Size(min = 6, max = 72)
    @MaxUtf8Bytes(72)
    private String password;

    public String getUsername() { return username; }

    public void setUsername(String username) {
        this.username = username == null ? null : username.trim();
    }

    public String getEmail() { return email; }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }

    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }
}
