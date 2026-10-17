package com.rewind.rewind.tmdb;

public record TmdbDiscoveryImportResponse(
        int page,
        int totalPages,
        int totalResults,
        int discovered,
        TmdbBatchSyncResponse imports
) {}
