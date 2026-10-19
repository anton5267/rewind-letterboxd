package com.rewind.rewind.search.dto;

import java.time.Instant;

public record GlobalSearchArticleResponse(
        Long id,
        String slug,
        String category,
        String title,
        String excerpt,
        String coverUrl,
        Instant publishedAt
) {}
