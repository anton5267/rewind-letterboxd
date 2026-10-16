package com.rewind.rewind.movie.controller;

import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.dto.MovieDetailsResponse;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.MovieDetailsService;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieRepository movies;
    private final MovieDetailsService details;

    public MovieController(MovieRepository movies, MovieDetailsService details) {
        this.movies = movies;
        this.details = details;
    }

    @GetMapping
    public Page<MovieCardResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "id"));

        return movies.findAll(pageable).map(m -> new MovieCardResponse(
                m.getId(),
                m.getTitle(),
                m.getReleaseDate(),
                m.getRating(),
                m.getPhotoUrl()
        ));
    }

    // GET /api/movies/{id} -> повна деталка
    @GetMapping("/{id}")
    public ResponseEntity<MovieDetailsResponse> getById(@PathVariable Long id, Authentication auth) {
        String emailOrNull = (auth == null ? null : auth.getName());

        try {
            // якщо фільму нема — MovieDetailsService має кинути 404 (див. нижче)
            return ResponseEntity.ok(details.getDetails(id, emailOrNull));
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }
}
