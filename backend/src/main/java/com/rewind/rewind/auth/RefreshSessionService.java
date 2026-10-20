package com.rewind.rewind.auth;

import com.rewind.rewind.security.JwtService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RefreshSessionService {
    public record Tokens(String access, String refresh) {}

    private final RefreshSessionRepository sessions;
    private final UserRepository users;
    private final JwtService jwt;
    private final SecureRandom random = new SecureRandom();
    private final String pepper;
    private final long refreshDays;

    public RefreshSessionService(RefreshSessionRepository sessions, UserRepository users, JwtService jwt,
            @Value("${app.jwt.secret}") String pepper,
            @Value("${app.auth.refresh-days}") long refreshDays) {
        this.sessions = sessions;
        this.users = users;
        this.jwt = jwt;
        this.pepper = pepper;
        this.refreshDays = refreshDays;
    }

    @Transactional
    public Tokens issue(String email) {
        User user = users.findByEmail(email).orElseThrow(this::unauthorized);
        if (!Boolean.TRUE.equals(user.getIsActive())) throw unauthorized();
        return create(user);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Tokens refresh(String rawRefresh) {
        if (rawRefresh == null || rawRefresh.isBlank()) throw unauthorized();
        RefreshSession previous = sessions.findByTokenHash(hash(rawRefresh)).orElseThrow(this::unauthorized);
        User user = previous.getUser();
        if (previous.getRevokedAt() != null) {
            revokeAllForUser(user.getId());
            throw unauthorized();
        }
        if (!previous.getExpiresAt().isAfter(Instant.now()) || !Boolean.TRUE.equals(user.getIsActive())) {
            previous.setRevokedAt(Instant.now());
            throw unauthorized();
        }
        previous.setRevokedAt(Instant.now());
        return create(user);
    }

    @Transactional
    public void revoke(String rawRefresh) {
        if (rawRefresh == null || rawRefresh.isBlank()) return;
        sessions.findByTokenHash(hash(rawRefresh)).ifPresent(session -> session.setRevokedAt(Instant.now()));
    }

    private Tokens create(User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshSession session = new RefreshSession();
        session.setUser(user);
        session.setTokenHash(hash(refresh));
        session.setExpiresAt(Instant.now().plus(refreshDays, ChronoUnit.DAYS));
        sessions.save(session);
        return new Tokens(jwt.generateToken(user.getEmail(), user.getRole().name()), refresh);
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        Instant now = Instant.now();
        sessions.findAllByUserIdAndRevokedAtIsNull(userId)
                .forEach(session -> session.setRevokedAt(now));
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session is invalid or expired");
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
