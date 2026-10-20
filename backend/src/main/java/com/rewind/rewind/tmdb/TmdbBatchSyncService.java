package com.rewind.rewind.tmdb;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class TmdbBatchSyncService {
    private final TmdbSyncService syncService;

    public TmdbBatchSyncService(TmdbSyncService syncService) {
        this.syncService = syncService;
    }

    public TmdbBatchSyncResponse sync(TmdbBatchSyncRequest request) {
        List<TmdbBatchSyncResponse.Item> items = new ArrayList<>();
        int succeeded = 0;
        for (TmdbBatchSyncRequest.MovieRequest movie : request.movies()) {
            TmdbSyncRequest single = new TmdbSyncRequest();
            single.setTmdbId(movie.tmdbId());
            single.setSyncSimilar(request.syncSimilar());
            try {
                TmdbSyncResponse result = syncService.sync(movie.movieId(), single);
                items.add(new TmdbBatchSyncResponse.Item(result.movieId(), result.tmdbId(), "SYNCED",
                        result.title(), "Metadata synchronized"));
                succeeded++;
            } catch (ResponseStatusException ex) {
                String reason = ex.getReason();
                String message = reason == null || reason.isBlank() ? ex.getStatusCode().toString() : reason;
                items.add(new TmdbBatchSyncResponse.Item(movie.movieId(), movie.tmdbId(), "FAILED", null, message));
            } catch (RuntimeException ex) {
                items.add(new TmdbBatchSyncResponse.Item(movie.movieId(), movie.tmdbId(), "FAILED", null,
                        "TMDB synchronization failed"));
            }
        }
        return new TmdbBatchSyncResponse(request.movies().size(), succeeded,
                request.movies().size() - succeeded, List.copyOf(items));
    }
}
