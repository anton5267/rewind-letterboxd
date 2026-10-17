package com.rewind.rewind;

import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.externalrating.entity.ExternalRatingSource;
import com.rewind.rewind.externalrating.repo.ExternalRatingRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.similar.repo.SimilarMovieRepository;
import com.rewind.rewind.tmdb.TmdbClient;
import com.rewind.rewind.tmdb.TmdbSyncRequest;
import com.rewind.rewind.tmdb.TmdbSyncResponse;
import com.rewind.rewind.tmdb.TmdbSyncService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
class TmdbSyncIntegrationTests {
    @Autowired TmdbSyncService sync;
    @Autowired MovieRepository movies;
    @Autowired MovieActorRepository movieActors;
    @Autowired MovieDirectorRepository movieDirectors;
    @Autowired ExternalRatingRepository externalRatings;
    @Autowired SimilarMovieRepository similarMovies;

    @MockitoBean TmdbClient tmdb;

    @Test
    @Transactional
    void controlledSyncPersistsMetadataPeopleRatingAndExistingSimilarLinks() {
        Movie movie = new Movie();
        movie.setTitle("Before TMDB sync");
        Long movieId = movies.saveAndFlush(movie).getId();

        Movie existingSimilar = new Movie();
        existingSimilar.setTitle("Already in local catalog");
        existingSimilar.setTmdbId(200L);
        movies.saveAndFlush(existingSimilar);

        when(tmdb.fetchMovie(100L)).thenReturn(new TmdbClient.MovieData(
                100L,
                "tt0100100",
                "Synced title",
                121,
                LocalDate.of(2025, 1, 2),
                "A controlled synopsis",
                "https://image.tmdb.org/t/p/w500/poster.jpg",
                "https://image.tmdb.org/t/p/original/backdrop.jpg",
                "https://www.youtube.com/watch?v=trailer",
                new BigDecimal("7.4"),
                1234,
                List.of(new TmdbClient.GenreData(18L, "Drama")),
                List.of(new TmdbClient.CastData(300L, "Actor One", "https://image.tmdb.org/t/p/w185/actor.jpg", "Lead", 0)),
                List.of(new TmdbClient.CrewData(400L, "Director One", "https://image.tmdb.org/t/p/w185/director.jpg")),
                List.of(200L, 999L)
        ));

        TmdbSyncRequest request = new TmdbSyncRequest();
        request.setTmdbId(100L);
        TmdbSyncResponse result = sync.sync(movieId, request);

        Movie saved = movies.findById(movieId).orElseThrow();
        assertEquals(100L, saved.getTmdbId());
        assertEquals("tt0100100", saved.getImdbId());
        assertEquals("Synced title", saved.getTitle());
        assertEquals(1, result.genresUpdated());
        assertEquals(1, result.actorsUpdated());
        assertEquals(1, result.directorsUpdated());
        assertEquals(1, result.similarMoviesLinked());
        assertTrue(result.trailerUpdated());
        assertEquals(1, movieActors.findById_MovieIdOrderByCastOrderAsc(movieId).size());
        assertEquals(1, movieDirectors.findById_MovieId(movieId).size());
        assertEquals(new BigDecimal("7.4"), externalRatings.findByMovieIdAndSource(movieId, ExternalRatingSource.TMDB)
                .orElseThrow().getRating());
        assertEquals(1, similarMovies.findById_MovieId(movieId).size());
        assertEquals(existingSimilar.getId(), similarMovies.findById_MovieId(movieId).get(0).getSimilarMovie().getId());
    }
}
