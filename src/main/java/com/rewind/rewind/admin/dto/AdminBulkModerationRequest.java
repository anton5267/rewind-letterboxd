package com.rewind.rewind.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminBulkModerationRequest(
        @NotEmpty @Size(max = 50) List<@Valid AdminModerationTarget> items,
        @NotBlank @Size(max = 500) String reason
) {}
