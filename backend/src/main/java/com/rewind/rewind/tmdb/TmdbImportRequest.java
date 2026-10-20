package com.rewind.rewind.tmdb;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TmdbImportRequest(
        @NotEmpty @Size(max = 20) List<@NotNull @Positive Long> tmdbIds,
        boolean syncSimilar
) {}
