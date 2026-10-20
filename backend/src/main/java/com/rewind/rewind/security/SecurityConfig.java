package com.rewind.rewind.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.http.HttpMethod;





@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        return CookieCsrfTokenRepository.withHttpOnlyFalse();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            CookieCsrfTokenRepository csrfTokenRepository) throws Exception {
        return http
                .csrf(csrf -> csrf.spa()
                        .csrfTokenRepository(csrfTokenRepository)
                        // JWT rehydration is not a new login. AuthController rotates at login/logout.
                        .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy()))
                .cors(Customizer.withDefaults())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            if (!response.isCommitted()) response.sendError(401);
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            if (response.isCommitted()) return;
                            if (request.getRequestURI().endsWith("/notifications/stream")) {
                                response.setStatus(403);
                                return;
                            }
                            response.sendError(403);
                        }))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // SSE завершуються внутрішнім async dispatch після закриття клієнтського з'єднання.
                        // Це не новий зовнішній запит, тому не треба повторно вимагати JWT для цього dispatch.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        // Keep application errors from being masked as 403.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()

                        // Swagger and OpenAPI endpoints.
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers("/api/auth/**").permitAll()

                        // Public movie GET endpoints.
                        .requestMatchers(HttpMethod.GET, "/api/movies").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search/global").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/*/details").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/*/reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/recent").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/popular").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/*/comments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/*/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/genres").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/popular").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/actors/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/directors/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/producers/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/journal/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lists/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lists/public/popular").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lists/public/recently-liked").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lists/public/team").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lists/public/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/hq").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/directory").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/collections/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/liked-reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/lists").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/following").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/activity").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/activity/recent-watched").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )



                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
