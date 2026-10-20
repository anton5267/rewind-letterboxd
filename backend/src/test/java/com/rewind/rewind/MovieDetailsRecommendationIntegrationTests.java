package com.rewind.rewind;

import com.rewind.rewind.genre.entity.Genre;
import com.rewind.rewind.genre.repo.GenreRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.MovieDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MovieDetailsRecommendationIntegrationTests {
    @Autowired MovieRepository movies;
    @Autowired GenreRepository genres;
    @Autowired MovieDetailsService details;

    @Test
    @Transactional
    void usesGenreFallbackForSimilarFilmsAndExposesTrailerOnlyWhenPresent() {
        Genre genre = new Genre();
        genre.setName("Recommendation " + UUID.randomUUID().toString().substring(0, 8));
        genre = genres.saveAndFlush(genre);

        Movie movie = new Movie();
        movie.setTitle("Recommendation source fixture");
        movie.getGenres().add(genre);
        movie = movies.saveAndFlush(movie);

        Movie similar = new Movie();
        similar.setTitle("Recommendation matching fixture");
        similar.getGenres().add(genre);
        similar = movies.saveAndFlush(similar);

        Movie unrelated = new Movie();
        unrelated.setTitle("Recommendation unrelated fixture");
        movies.saveAndFlush(unrelated);

        assertNull(details.getDetails(movie.getId(), null).getTrailerUrl());
        movie.setTrailerUrl("https://example.invalid/trailer");
        movies.saveAndFlush(movie);
        var response = details.getDetails(movie.getId(), null);
        assertEquals("https://example.invalid/trailer", response.getTrailerUrl());
        assertEquals(List.of(similar.getId()), response.getSimilarMovies().stream().map(candidate -> candidate.getId()).toList());
    }
}
