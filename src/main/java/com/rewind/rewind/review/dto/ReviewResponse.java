package com.rewind.rewind.review.dto;

import java.time.Instant;

public class ReviewResponse {

    private Long id;
    private Long userId;
    private String username;
    private String userAvatarUrl;
    private String content;
    private Integer rating;      // ✅ додали
    private Instant createdAt;

    public ReviewResponse(Long id, Long userId, String username, String userAvatarUrl,
                          String content, Integer rating, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.userAvatarUrl = userAvatarUrl;
        this.content = content;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getUserAvatarUrl() { return userAvatarUrl; }
    public String getContent() { return content; }
    public Integer getRating() { return rating; }
    public Instant getCreatedAt() { return createdAt; }
}
