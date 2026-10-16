package com.rewind.rewind.security;

import com.rewind.rewind.user.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            var claims = jwtService.parseClaims(token);
            String email = claims.getSubject();

            // ✅ Важливо: не довіряємо ролі з токена на 100%.
            // Беремо користувача з БД і його актуальний статус/роль.
            var userOpt = users.findByEmail(email);
            if (userOpt.isEmpty()) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            var user = userOpt.get();

            // ✅ Якщо ти використовуєш isActive (деактивація)
            // (Якщо поле називається інакше — скажу нижче що замінити)
            if (user.getIsActive() != null && !user.getIsActive()) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            // ✅ Якщо ти додав блокування через isBlocked
            // Якщо такого поля немає — просто видали цей блок
            try {
                var m = user.getClass().getMethod("getIsBlocked");
                Object val = m.invoke(user);
                if (val instanceof Boolean b && b) {
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }
            } catch (Exception ignore) {
                // поля isBlocked може не бути — тоді просто ігноруємо
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
