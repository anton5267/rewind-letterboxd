package com.rewind.rewind.auth;

import com.rewind.rewind.user.repo.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwords;
    private final RefreshSessionService sessions;
    private final JavaMailSender mail;
    private final SecureRandom random = new SecureRandom();
    private final String resetUrl;
    private final String pepper;
    private final long ttlMinutes;
    private final String from;

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
            PasswordEncoder passwords, RefreshSessionService sessions, JavaMailSender mail,
            @Value("${app.security.reset-password.frontend-reset-url}") String resetUrl,
            @Value("${app.security.reset-password.token-pepper}") String pepper,
            @Value("${app.security.reset-password.token-ttl-minutes}") long ttlMinutes,
            @Value("${app.security.reset-password.from}") String from) {
        this.users = users;
        this.tokens = tokens;
        this.passwords = passwords;
        this.sessions = sessions;
        this.mail = mail;
        this.resetUrl = resetUrl;
        this.pepper = pepper;
        this.ttlMinutes = ttlMinutes;
        this.from = from;
    }

    @Transactional
    public void request(String email) {
        String normalizedEmail = email == null ? "" : email.trim();
        users.findByEmail(normalizedEmail).filter(user -> Boolean.TRUE.equals(user.getIsActive())).ifPresent(user -> {
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            tokens.deleteByUserId(user.getId());
            tokens.flush();
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(hash(raw));
            token.setExpiresAt(Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES));
            tokens.save(token);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(user.getEmail());
            message.setSubject("Reset your Rewind password");
            message.setText("Open this link to set a new password: " + resetUrl + "?token=" + raw
                    + "\nThis link expires in " + ttlMinutes + " minutes.");
            try {
                mail.send(message);
            } catch (MailException exception) {
                log.error("Password reset email delivery failed", exception);
            }
        });
    }

    @Transactional
    public void reset(String rawToken, String newPassword) {
        PasswordResetToken token = tokens.findByTokenHash(hash(rawToken))
                .orElseThrow(this::invalidToken);
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(Instant.now())
                || !Boolean.TRUE.equals(token.getUser().getIsActive())) {
            throw invalidToken();
        }
        token.getUser().setPasswordHash(passwords.encode(newPassword));
        token.setUsedAt(Instant.now());
        sessions.revokeAllForUser(token.getUser().getId());
    }

    private ResponseStatusException invalidToken() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link");
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(pepper.getBytes(StandardCharsets.UTF_8));
            digest.update((byte) ':');
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }
}
