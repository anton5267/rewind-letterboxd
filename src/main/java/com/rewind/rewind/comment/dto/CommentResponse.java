package com.rewind.rewind.comment.dto;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long reviewId,
        Long userId,
        String username,
        String userAvatarUrl,
        String text,
        Instant createdAt,
        Instant updatedAt
) {}
