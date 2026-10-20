package com.rewind.rewind.comment.entity;

import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "comments")
public class ReviewComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    @Column(name = "moderated_reason", length = 255)
    private String moderatedReason;

    @Column(name = "moderated_at")
    private Instant moderatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by")
    private User moderatedBy;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Boolean getIsHidden() { return isHidden; }
    public void setIsHidden(Boolean hidden) { isHidden = hidden; }
    public String getModeratedReason() { return moderatedReason; }
    public void setModeratedReason(String reason) { moderatedReason = reason; }
    public Instant getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(Instant at) { moderatedAt = at; }
    public User getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(User user) { moderatedBy = user; }
}
