package com.rewind.rewind;

import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.MovieDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MovieDetailsRecommendationIntegrationTests {
    @Autowired MovieRepository movies;
    @Autowired MovieDetailsService details;

    @Test
    @Transactional
    void usesGenreFallbackForSimilarFilmsAndExposesTrailerOnlyWhenPresent() {
        var movie = movies.findById(1L).orElseThrow();
        movie.setTrailerUrl("https://example.invalid/trailer");
        movies.saveAndFlush(movie);
        var response = details.getDetails(1L, null);
        assertEquals("https://example.invalid/trailer", response.getTrailerUrl());
        assertFalse(response.getSimilarMovies().isEmpty());
        assertTrue(response.getSimilarMovies().stream().noneMatch(candidate -> candidate.getId().equals(1L)));
    }
}
