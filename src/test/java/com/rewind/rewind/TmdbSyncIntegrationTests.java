package com.rewind.rewind;

import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.externalrating.entity.ExternalRatingSource;
import com.rewind.rewind.externalrating.repo.ExternalRatingRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.similar.repo.SimilarMovieRepository;
import com.rewind.rewind.tmdb.TmdbClient;
import com.rewind.rewind.tmdb.TmdbBatchSyncRequest;
import com.rewind.rewind.tmdb.TmdbBatchSyncResponse;
import com.rewind.rewind.tmdb.TmdbBatchSyncService;
import com.rewind.rewind.tmdb.TmdbImportRequest;
import com.rewind.rewind.tmdb.TmdbImportService;
import com.rewind.rewind.tmdb.TmdbDiscoveryImportResponse;
import com.rewind.rewind.tmdb.TmdbDiscoveryRequest;
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
    @Autowired TmdbBatchSyncService batchSync;
    @Autowired TmdbImportService importService;
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

    @Test
    @Transactional
    void batchSyncKeepsPerMovieResultAndContinuesAfterProviderFailure() {
        Movie first = new Movie();
        first.setTitle("Batch first");
        Long firstId = movies.saveAndFlush(first).getId();
        Movie second = new Movie();
        second.setTitle("Batch second");
        Long secondId = movies.saveAndFlush(second).getId();

        when(tmdb.fetchMovie(500L)).thenReturn(new TmdbClient.MovieData(
                500L, "tt0500500", "Batch synced", 100, LocalDate.of(2024, 2, 3),
                "Batch overview", null, null, null, new BigDecimal("6.8"), 42,
                List.of(), List.of(), List.of(), List.of()));
        when(tmdb.fetchMovie(501L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "TMDB movie not found"));

        TmdbBatchSyncRequest request = new TmdbBatchSyncRequest(List.of(
                new TmdbBatchSyncRequest.MovieRequest(firstId, 500L),
                new TmdbBatchSyncRequest.MovieRequest(secondId, 501L)
        ), false);
        TmdbBatchSyncResponse result = batchSync.sync(request);

        assertEquals(2, result.requested());
        assertEquals(1, result.succeeded());
        assertEquals(1, result.failed());
        assertEquals("SYNCED", result.items().get(0).status());
        assertEquals("FAILED", result.items().get(1).status());
        assertEquals(500L, movies.findById(firstId).orElseThrow().getTmdbId());
        assertNull(movies.findById(secondId).orElseThrow().getTmdbId());
    }

    @Test
    @Transactional
    void importCreatesNewMoviesAndRollsBackFailedItemsIndependently() {
        when(tmdb.fetchMovie(700L)).thenReturn(new TmdbClient.MovieData(
                700L, "tt0700700", "Imported title", 98, LocalDate.of(2023, 7, 8),
                "Imported overview", null, null, null, new BigDecimal("7.1"), 700,
                List.of(), List.of(), List.of(), List.of()));
        when(tmdb.fetchMovie(701L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "TMDB movie not found"));

        TmdbBatchSyncResponse result = importService.importMovies(
                new TmdbImportRequest(List.of(700L, 701L), false));

        assertEquals(2, result.requested());
        assertEquals(1, result.succeeded());
        assertEquals(1, result.failed());
        assertEquals("IMPORTED", result.items().get(0).status());
        assertEquals("FAILED", result.items().get(1).status());
        assertEquals(700L, movies.findByTmdbId(700L).orElseThrow().getTmdbId());
        assertEquals("Imported title", movies.findByTmdbId(700L).orElseThrow().getTitle());
        assertTrue(movies.findByTmdbId(701L).isEmpty());
    }

    @Test
    void importRejectsDuplicateTmdbIds() {
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> importService.importMovies(new TmdbImportRequest(List.of(700L, 700L), false)));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    @Transactional
    void discoveryImportUsesProviderFiltersAndKeepsPerMovieResults() {
        when(tmdb.discoverMovies(2, 2024, 18L, new BigDecimal("7.0"), 2))
                .thenReturn(new TmdbClient.DiscoveryPage(2, 12, 240, List.of(800L, 801L)));
        when(tmdb.fetchMovie(800L)).thenReturn(new TmdbClient.MovieData(
                800L, "tt0800800", "Discovery hit", 110, LocalDate.of(2024, 5, 6),
                "Discovery overview", null, null, null, new BigDecimal("7.3"), 800,
                List.of(), List.of(), List.of(), List.of()));
        when(tmdb.fetchMovie(801L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "TMDB movie not found"));

        TmdbDiscoveryImportResponse result = importService.importDiscovered(new TmdbDiscoveryRequest(
                2, 2024, 18L, new BigDecimal("7.0"), 2, false));

        assertEquals(2, result.page());
        assertEquals(12, result.totalPages());
        assertEquals(240, result.totalResults());
        assertEquals(2, result.discovered());
        assertEquals(1, result.imports().succeeded());
        assertEquals(1, result.imports().failed());
        assertEquals("Discovery hit", movies.findByTmdbId(800L).orElseThrow().getTitle());
        assertTrue(movies.findByTmdbId(801L).isEmpty());
    }
}
