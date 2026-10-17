package com.rewind.rewind.newsletter.entity;

import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "newsletter_subscriptions", uniqueConstraints = @UniqueConstraint(
        name = "uq_newsletter_subscriptions_user", columnNames = "user_id"))
public class NewsletterSubscription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_subscribed", nullable = false)
    private Boolean subscribed = false;

    @Column(name = "subscribed_at")
    private Instant subscribedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Boolean getSubscribed() { return subscribed; }
    public void setSubscribed(Boolean subscribed) { this.subscribed = subscribed; }
    public Instant getSubscribedAt() { return subscribedAt; }
    public void setSubscribedAt(Instant subscribedAt) { this.subscribedAt = subscribedAt; }
}
