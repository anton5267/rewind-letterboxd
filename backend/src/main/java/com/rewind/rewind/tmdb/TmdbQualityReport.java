package com.rewind.rewind.tmdb;

public record TmdbQualityReport(
        long totalMovies,
        long tmdbLinkedMovies,
        long completeTmdbMovies,
        long missingPoster,
        long missingBackdrop,
        long missingPlot,
        long missingRuntime,
        long missingTrailer,
        long missingTmdbRating,
        double linkedCoveragePercent,
        double metadataCompletenessPercent
) {}
