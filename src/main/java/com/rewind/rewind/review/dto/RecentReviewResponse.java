package com.rewind.rewind.review.dto;

import java.time.Instant;

public record RecentReviewResponse(
        Long id,
        Long movieId,
        String movieTitle,
        Long userId,
        String username,
        String content,
        Integer rating,
        Instant createdAt,
        String moviePhotoUrl,
        String userAvatarUrl
) {}
