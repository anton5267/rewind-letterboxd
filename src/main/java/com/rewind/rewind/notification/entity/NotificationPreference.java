package com.rewind.rewind.notification.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {
    @Id
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "follows_enabled", nullable = false) private boolean followsEnabled = true;
    @Column(name = "review_likes_enabled", nullable = false) private boolean reviewLikesEnabled = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public boolean isFollowsEnabled() { return followsEnabled; }
    public void setFollowsEnabled(boolean followsEnabled) { this.followsEnabled = followsEnabled; }
    public boolean isReviewLikesEnabled() { return reviewLikesEnabled; }
    public void setReviewLikesEnabled(boolean reviewLikesEnabled) { this.reviewLikesEnabled = reviewLikesEnabled; }
}
