package com.rewind.rewind;

import com.rewind.rewind.security.AuthRateLimitFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthRateLimitFilterTests {
    @Test
    void limitsEachIpAndEndpointAfterConfiguredWindowQuota() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(2, Clock.fixed(Instant.parse("2026-10-17T10:00:00Z"), ZoneOffset.UTC));
        FilterChain chain = (request, response) -> ((MockHttpServletResponse) response).setStatus(200);

        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest request = request("/api/auth/login", "10.0.0.10");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        MockHttpServletResponse limited = new MockHttpServletResponse();
        filter.doFilter(request("/api/auth/login", "10.0.0.10"), limited, chain);
        assertEquals(429, limited.getStatus());
        assertEquals("60", limited.getHeader("Retry-After"));

        MockHttpServletResponse otherEndpoint = new MockHttpServletResponse();
        filter.doFilter(request("/api/auth/register", "10.0.0.10"), otherEndpoint, chain);
        assertEquals(200, otherEndpoint.getStatus());
    }

    private MockHttpServletRequest request(String uri, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRemoteAddr(ip);
        return request;
    }
}
