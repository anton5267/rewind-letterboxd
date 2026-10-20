package com.rewind.rewind.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    private String allowedOrigins = "";

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins == null ? "" : allowedOrigins;
    }

    public List<String> origins() {
        String configuredOrigins = allowedOrigins == null ? "" : allowedOrigins;
        List<String> origins = new ArrayList<String>();
        for (String value : configuredOrigins.split(",")) {
            String origin = value.trim();
            if (!origin.isEmpty()) {
                origins.add(validateOrigin(origin));
            }
        }
        return List.copyOf(origins);
    }

    private static String validateOrigin(String origin) {
        if ("*".equals(origin)) {
            throw new IllegalStateException("Wildcard CORS origins are not allowed with credentials");
        }

        final URI parsed;
        try {
            parsed = URI.create(origin);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid CORS origin: " + origin, exception);
        }

        boolean supportedScheme = "http".equalsIgnoreCase(parsed.getScheme())
                || "https".equalsIgnoreCase(parsed.getScheme());
        boolean hasPath = parsed.getRawPath() != null && !parsed.getRawPath().isEmpty();
        if (!supportedScheme || parsed.getHost() == null || parsed.getUserInfo() != null
                || hasPath || parsed.getRawQuery() != null || parsed.getRawFragment() != null) {
            throw new IllegalStateException("CORS origin must be an HTTP(S) origin without a path: " + origin);
        }
        return origin;
    }
}
