package com.rewind.rewind.notification.dto;

import com.rewind.rewind.notification.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        Instant createdAt,
        Instant readAt,
        Actor actor,
        Long relatedUserId,
        Long reviewId
) {
    public record Actor(Long id, String username, String displayName, String avatarUrl) {}
}
