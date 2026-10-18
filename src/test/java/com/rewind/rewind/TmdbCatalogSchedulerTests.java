package com.rewind.rewind;

import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.tmdb.TmdbCatalogScheduler;
import com.rewind.rewind.tmdb.TmdbSyncService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TmdbCatalogSchedulerTests {
    @Test
    void syncsOnlyTheConfiguredBatchAndContinuesThroughThePage() {
        Movie first = movie(11L, 101L);
        Movie second = movie(12L, 102L);
        Movie third = movie(13L, 103L);
        MovieRepository movies = mock(MovieRepository.class);
        TmdbSyncService sync = mock(TmdbSyncService.class);
        when(movies.findByTmdbIdIsNotNull(any())).thenReturn(new PageImpl<>(List.of(first, second, third)));

        new TmdbCatalogScheduler(movies, sync, 2).refreshCatalogMetadata();

        verify(sync).sync(eq(11L), argThat(request -> request.getTmdbId().equals(101L) && !request.isSyncSimilar()));
        verify(sync).sync(eq(12L), argThat(request -> request.getTmdbId().equals(102L) && !request.isSyncSimilar()));
        verify(sync, never()).sync(eq(13L), any());
    }

    private Movie movie(long id, long tmdbId) {
        Movie movie = mock(Movie.class);
        when(movie.getId()).thenReturn(id);
        when(movie.getTmdbId()).thenReturn(tmdbId);
        return movie;
    }
}
