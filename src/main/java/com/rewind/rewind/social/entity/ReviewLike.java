package com.rewind.rewind.social.entity;

import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "review_likes", uniqueConstraints = @UniqueConstraint(name = "uk_review_likes_pair", columnNames = {"review_id", "user_id"}))
public class ReviewLike {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Instant getCreatedAt() { return createdAt; }
}
