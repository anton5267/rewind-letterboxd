package com.rewind.rewind.admin.dto;

import java.time.Instant;

public record AdminModerationQueueItem(
        String type,
        Long id,
        Long parentId,
        Long movieId,
        String subject,
        Long userId,
        String username,
        String content,
        Instant createdAt
) {}
