package com.rewind.rewind.profile.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record FavoriteMoveRequest(
        @Positive long movieId,
        @Positive long targetMovieId,
        @NotNull @Pattern(regexp = "before|after") String placement,
        @Positive long expectedUserId) {
}
