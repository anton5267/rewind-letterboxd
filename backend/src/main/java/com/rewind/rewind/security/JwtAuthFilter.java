package com.rewind.rewind.security;

import com.rewind.rewind.user.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("rewind_access".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        if (token == null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            var claims = jwtService.parseClaims(token);
            String email = claims.getSubject();

            // Do not trust the role from the token without rechecking the user.
            // Беремо користувача з БД і його актуальний статус/роль.
            var userOpt = users.findByEmail(email);
            if (userOpt.isEmpty()) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            var user = userOpt.get();

            // Fail closed for a missing or disabled account flag.
            if (!Boolean.TRUE.equals(user.getIsActive())) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            String role = user.getRole().name();

            var auth = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            // якщо токен битий — просто не аутентифікуємо
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
