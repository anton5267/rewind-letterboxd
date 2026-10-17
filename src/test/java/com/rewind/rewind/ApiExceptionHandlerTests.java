package com.rewind.rewind;

import com.rewind.rewind.config.ApiErrorResponse;
import com.rewind.rewind.config.ApiExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiExceptionHandlerTests {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void invalidRequestUsesStableErrorContract() {
        HttpServletRequest request = request("/api/lists");
        ApiErrorResponse response = handler.invalid(new IllegalArgumentException("name is required"), request).getBody();
        assertEquals(400, response.status());
        assertEquals("Bad Request", response.error());
        assertEquals("name is required", response.message());
        assertEquals("/api/lists", response.path());
    }

    @Test
    void missingRequestUsesStableErrorContract() {
        ApiErrorResponse response = handler.missing(request("/api/movies/999")).getBody();
        assertEquals(404, response.status());
        assertEquals("Resource not found", response.message());
    }

    private HttpServletRequest request(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(path);
        return request;
    }
}
