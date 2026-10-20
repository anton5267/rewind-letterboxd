package com.rewind.rewind.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AdminModerationTarget(
        @NotBlank String type,
        @NotNull @Positive Long id
) {}
