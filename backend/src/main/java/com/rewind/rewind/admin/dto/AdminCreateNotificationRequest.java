package com.rewind.rewind.admin.dto;

import com.rewind.rewind.notification.entity.NotificationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AdminCreateNotificationRequest(
        @NotNull @Positive Long recipientId,
        @NotNull NotificationType type,
        @Positive Long actorId,
        @Positive Long relatedUserId,
        @Positive Long reviewId
) {}
