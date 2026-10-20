package com.rewind.rewind.movie.controller;

import com.rewind.rewind.movie.dto.MovieStatusResponse;
import com.rewind.rewind.movie.service.status.MovieStatusService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class MovieStatusController {

    private final MovieStatusService service;

    public MovieStatusController(MovieStatusService service) {
        this.service = service;
    }

    @GetMapping("/{movieId}/status/me")
    public MovieStatusResponse my(Authentication auth, @PathVariable Long movieId) {
        return service.myStatus(auth.getName(), movieId);
    }
}
