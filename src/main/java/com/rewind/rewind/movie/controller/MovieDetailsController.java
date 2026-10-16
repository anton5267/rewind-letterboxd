package com.rewind.rewind.movie.controller;

import com.rewind.rewind.movie.dto.MovieDetailsResponse;
import com.rewind.rewind.movie.service.MovieDetailsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class MovieDetailsController {

    private final MovieDetailsService movieDetailsService;

    public MovieDetailsController(MovieDetailsService movieDetailsService) {
        this.movieDetailsService = movieDetailsService;
    }

    @GetMapping("/{id}/details")
    public MovieDetailsResponse details(@PathVariable Long id, Authentication auth) {
        String email = (auth == null ? null : auth.getName());
        return movieDetailsService.getDetails(id, email);
    }
}
