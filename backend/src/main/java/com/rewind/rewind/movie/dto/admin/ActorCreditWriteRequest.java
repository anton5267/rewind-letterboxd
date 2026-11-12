package com.rewind.rewind.movie.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ActorCreditWriteRequest(
        @NotNull @Positive Long actorId,
        @Size(max = 150) String characterName,
        @PositiveOrZero Integer castOrder
) {}
