package com.rewind.rewind.social.entity;

import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.user.entity.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "list_likes", uniqueConstraints = @UniqueConstraint(name = "uk_list_likes_pair", columnNames = {"list_id", "user_id"}))
public class ListLike {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id", nullable = false)
    private MovieList list;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public MovieList getList() { return list; }
    public void setList(MovieList list) { this.list = list; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Instant getCreatedAt() { return createdAt; }
}
