package com.rewind.rewind;

import com.rewind.rewind.auth.PasswordResetService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
class PasswordResetIntegrationTests {
    @Autowired PasswordResetService reset;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @MockitoBean JavaMailSender mail;

    @Test
    void resetTokenIsSingleUseAndUnknownEmailGetsSameResponse() {
        String email = "reset-" + UUID.randomUUID() + "@example.invalid";
        User user = new User();
        user.setUsername("reset" + UUID.randomUUID().toString().substring(0, 10));
        user.setEmail(email);
        user.setPasswordHash(passwords.encode("OldPassword123!"));
        users.saveAndFlush(user);

        reset.request("missing@example.invalid");
        verify(mail, never()).send(any(SimpleMailMessage.class));

        reset.request(email);
        var captured = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(captured.capture());
        String body = captured.getValue().getText();
        assertNotNull(body);
        String token = body.split("token=")[1].split("\\s")[0];

        reset.reset(token, "NewPassword123!");
        users.flush();
        assertTrue(passwords.matches("NewPassword123!", users.findByEmail(email).orElseThrow().getPasswordHash()));
        assertThrows(ResponseStatusException.class, () -> reset.reset(token, "AnotherPassword123!"));
    }
}
