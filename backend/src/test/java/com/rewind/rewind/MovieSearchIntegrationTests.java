package com.rewind.rewind;

import com.rewind.rewind.genre.entity.Genre;
import com.rewind.rewind.genre.repo.GenreRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.search.MovieSearchService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MovieSearchIntegrationTests {
    @Autowired GenreRepository genres;
    @Autowired MovieRepository movies;
    @Autowired MovieSearchService search;

    @Test
    @Transactional
    void filtersSortAndPaginatesCatalog() {
        String name = "catalog-" + UUID.randomUUID().toString().substring(0, 8);
        Genre genre = new Genre();
        genre.setName(name);
        Long genreId = genres.saveAndFlush(genre).getId();

        Movie older = movie(name + " A", 2024, "4.0");
        older.getGenres().add(genre);
        movies.saveAndFlush(older);
        Movie newer = movie(name + " B", 2025, "3.5");
        newer.getGenres().add(genre);
        movies.saveAndFlush(newer);
        movies.saveAndFlush(movie(name + " C", 2025, "5.0"));

        var first = search.search(name, genreId, null, null, null, "newest", 0, 1);
        assertEquals(2, first.getTotalElements());
        assertEquals(name + " B", first.getContent().get(0).getTitle());
        var second = search.search(name, genreId, null, null, null, "newest", 1, 1);
        assertEquals(name + " A", second.getContent().get(0).getTitle());
        assertEquals(1, search.search(name, genreId, null, 2024,
                new BigDecimal("4.0"), "rating_desc", 0, 12).getTotalElements());
        assertTrue(search.search(name, genreId, null, 2025,
                new BigDecimal("4.0"), "rating_desc", 0, 12).isEmpty());
        assertEquals(name + " C", search.search(name, null, null, 2025,
                null, "rating_desc", 0, 12).getContent().get(0).getTitle());
    }

    private Movie movie(String title, int year, String rating) {
        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setReleaseDate(LocalDate.of(year, 1, 1));
        movie.setRating(new BigDecimal(rating));
        return movie;
    }
}
