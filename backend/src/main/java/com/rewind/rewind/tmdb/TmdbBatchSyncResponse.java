package com.rewind.rewind.tmdb;

import java.util.List;

public record TmdbBatchSyncResponse(
        int requested,
        int succeeded,
        int failed,
        List<Item> items
) {
    public record Item(
            Long movieId,
            Long tmdbId,
            String status,
            String title,
            String message
    ) {}
}
