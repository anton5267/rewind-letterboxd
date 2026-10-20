package com.rewind.rewind.message.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "conversations", uniqueConstraints = @UniqueConstraint(name = "uq_conversation_pair", columnNames = {"user_one_id", "user_two_id"}))
public class Conversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_one_id", nullable = false) private Long userOneId;
    @Column(name = "user_two_id", nullable = false) private Long userTwoId;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public Long getUserOneId() { return userOneId; }
    public void setUserOneId(Long userOneId) { this.userOneId = userOneId; }
    public Long getUserTwoId() { return userTwoId; }
    public void setUserTwoId(Long userTwoId) { this.userTwoId = userTwoId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
