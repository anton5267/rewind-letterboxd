package com.rewind.rewind.notification.repo;

import com.rewind.rewind.notification.entity.NotificationType;

import java.time.Instant;

public interface AdminNotificationProjection {
    Long getId();
    Long getRecipientId();
    Long getActorId();
    NotificationType getType();
    Long getReviewId();
    Instant getCreatedAt();
    Instant getReadAt();
}
