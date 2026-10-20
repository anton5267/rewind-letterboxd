package com.rewind.rewind.admin.settings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminSettingUpdateRequest(
        @NotBlank @Size(max = 255) String value
) {}
