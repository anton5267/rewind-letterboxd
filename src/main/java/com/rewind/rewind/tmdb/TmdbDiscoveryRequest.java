package com.rewind.rewind.tmdb;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TmdbDiscoveryRequest(
        @NotNull @Min(1) @Max(500) Integer page,
        @Min(1888) @Max(2100) Integer year,
        @Positive Long genreId,
        @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal minRating,
        @NotNull @Min(1) @Max(20) Integer limit,
        boolean syncSimilar
) {}
