package com.rewind.rewind.tmdb;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Service
public class TmdbImportService {
    private final TmdbSyncService syncService;

    public TmdbImportService(TmdbSyncService syncService) {
        this.syncService = syncService;
    }

    public TmdbBatchSyncResponse importMovies(TmdbImportRequest request) {
        if (new HashSet<>(request.tmdbIds()).size() != request.tmdbIds().size()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Duplicate TMDB ids are not allowed");
        }
        List<TmdbBatchSyncResponse.Item> items = new ArrayList<>();
        int succeeded = 0;
        for (Long tmdbId : request.tmdbIds()) {
            TmdbSyncRequest single = new TmdbSyncRequest();
            single.setTmdbId(tmdbId);
            single.setSyncSimilar(request.syncSimilar());
            try {
                TmdbSyncResponse result = syncService.importMovie(tmdbId, single);
                items.add(new TmdbBatchSyncResponse.Item(result.movieId(), result.tmdbId(), "IMPORTED",
                        result.title(), "Movie imported and metadata synchronized"));
                succeeded++;
            } catch (ResponseStatusException ex) {
                String reason = ex.getReason();
                String message = reason == null || reason.isBlank() ? ex.getStatusCode().toString() : reason;
                items.add(new TmdbBatchSyncResponse.Item(null, tmdbId, "FAILED", null, message));
            } catch (RuntimeException ex) {
                items.add(new TmdbBatchSyncResponse.Item(null, tmdbId, "FAILED", null,
                        "TMDB import failed"));
            }
        }
        return new TmdbBatchSyncResponse(request.tmdbIds().size(), succeeded,
                request.tmdbIds().size() - succeeded, List.copyOf(items));
    }
}
