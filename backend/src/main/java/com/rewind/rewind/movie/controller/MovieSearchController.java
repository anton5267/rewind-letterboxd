package com.rewind.rewind.movie.controller;

import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.service.search.MovieSearchService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/movies")
public class MovieSearchController {

    private final MovieSearchService service;

    public MovieSearchController(MovieSearchService service) {
        this.service = service;
    }

    @GetMapping("/search")
    public Page<MovieCardResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.search(q, genreId, tag, year, minRating, sort, page, size);
    }
}
