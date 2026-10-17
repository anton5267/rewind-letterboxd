package com.rewind.rewind.newsletter.entity;

import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "newsletter_deliveries", uniqueConstraints = @UniqueConstraint(
        name = "uq_newsletter_deliveries_article_user", columnNames = {"article_id", "user_id"}))
public class NewsletterDelivery {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_id", nullable = false)
    private JournalArticle article;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NewsletterDeliveryStatus status = NewsletterDeliveryStatus.PENDING;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "available_at", nullable = false)
    private Instant availableAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (availableAt == null) availableAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public JournalArticle getArticle() { return article; }
    public void setArticle(JournalArticle article) { this.article = article; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public NewsletterDeliveryStatus getStatus() { return status; }
    public void setStatus(NewsletterDeliveryStatus status) { this.status = status; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public Instant getAvailableAt() { return availableAt; }
    public void setAvailableAt(Instant availableAt) { this.availableAt = availableAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
