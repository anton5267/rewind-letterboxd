package com.rewind.rewind.journal.dto;

import java.time.Instant;

public record JournalArticleResponse(Long id, String slug, String language, String category, String title,
                                     String excerpt, String content, String coverUrl, String audioUrl, Instant publishedAt) {}
