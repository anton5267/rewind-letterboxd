package com.rewind.rewind.auth;

import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.dto.UserResponse;
import com.rewind.rewind.user.dto.UserLoginRequest;
import com.rewind.rewind.user.dto.UserLoginResponse;
import com.rewind.rewind.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService users;

    public AuthController(UserService users) {
        this.users = users;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        try {
            UserResponse created = users.register(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException ex) {
            // простий варіант: 400 + текст помилки
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserLoginRequest request) {
        try {
            UserLoginResponse loggedIn = users.login(request);
            return ResponseEntity.ok(loggedIn);
        } catch (IllegalArgumentException ex) {
            // Не світимо, що саме не так — email чи пароль
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }
}
