package com.rewind.rewind.journal.dto;

import jakarta.validation.constraints.*;

public record AdminJournalArticleRequest(
        @NotBlank @Size(max = 180) String slug,
        @NotBlank @Pattern(regexp = "uk|en") String language,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 500) String excerpt,
        @NotBlank String content,
        @Size(max = 500) String coverUrl,
        @Size(max = 500) @Pattern(regexp = "https?://.+", message = "Audio URL must use http or https") String audioUrl,
        boolean published
) {}
