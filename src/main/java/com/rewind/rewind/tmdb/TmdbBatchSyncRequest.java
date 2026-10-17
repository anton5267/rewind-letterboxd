package com.rewind.rewind.tmdb;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TmdbBatchSyncRequest(
        @NotEmpty @Size(max = 20) List<@Valid MovieRequest> movies,
        boolean syncSimilar
) {
    public record MovieRequest(
            @NotNull @Positive Long movieId,
            @NotNull @Positive Long tmdbId
    ) {}
}
