package com.rewind.rewind.admin.dto;

import java.time.Instant;

public record AdminCommentResponse(
        Long id,
        Long reviewId,
        Long userId,
        String username,
        String content,
        Boolean isHidden,
        String moderatedReason,
        Instant moderatedAt,
        Instant createdAt
) {}
