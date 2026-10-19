package com.rewind.rewind.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SocialLinkRequest(
        @NotBlank @Size(max = 30) String platform,
        @NotBlank @Size(max = 255) @Pattern(regexp = "https?://\\S+", message = "URL must use http or https") String url
) {}
