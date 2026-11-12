package com.rewind.rewind.movie.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Admin catalog row with the public review aggregate used by the editor. */
public record AdminMovieCatalogResponse(
        Long id,
        Long tmdbId,
        String title,
        LocalDate releaseDate,
        BigDecimal rating,
        String photoUrl,
        Integer durationMinutes,
        String ageRating,
        Long reviewCount
) {}
