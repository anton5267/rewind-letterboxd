package com.rewind.rewind.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small single-node guard for credential and password-reset endpoints.
 * Production deployments should put the same policy in a shared gateway/Redis bucket.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_SECONDS = 60;
    private final int limit;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Autowired
    public AuthRateLimitFilter(@Value("${app.security.rate-limit-per-minute:60}") int limit) {
        this(limit, Clock.systemUTC());
    }

    public AuthRateLimitFilter(int limit, Clock clock) {
        if (limit < 1) throw new IllegalArgumentException("Rate limit must be positive");
        this.limit = limit;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        return !path.equals("/api/auth/login")
                && !path.equals("/api/auth/register")
                && !path.equals("/api/auth/forgot-password")
                && !path.equals("/api/auth/reset-password");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        Instant now = clock.instant();
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || now.getEpochSecond() - current.startedAt >= WINDOW_SECONDS) {
                return new Window(now.getEpochSecond(), 1);
            }
            return new Window(current.startedAt, current.requests + 1);
        });

        if (window.requests > limit) {
            long retryAfter = Math.max(1, WINDOW_SECONDS - (now.getEpochSecond() - window.startedAt));
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(retryAfter));
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many authentication requests\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private record Window(long startedAt, int requests) {}
}
