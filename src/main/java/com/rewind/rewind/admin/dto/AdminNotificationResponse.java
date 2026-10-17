package com.rewind.rewind.admin.dto;

import com.rewind.rewind.notification.entity.NotificationType;

import java.time.Instant;

public record AdminNotificationResponse(
        Long id,
        Long recipientId,
        Long actorId,
        NotificationType type,
        Long reviewId,
        Instant createdAt,
        Instant readAt
) {}
