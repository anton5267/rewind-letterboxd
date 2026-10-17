package com.rewind.rewind.tmdb;

public record TmdbSyncResponse(
        Long movieId,
        Long tmdbId,
        String title,
        int genresUpdated,
        int actorsUpdated,
        int directorsUpdated,
        int similarMoviesLinked,
        boolean trailerUpdated
) {}
