package com.rewind.rewind.admin.dto;

import java.time.Instant;

public class AdminReviewResponse {

    private Long id;
    private Long movieId;
    private String movieTitle;

    private Long userId;
    private String username;

    private String content;
    private Integer rating;

    private Boolean isHidden;
    private String moderatedReason;
    private Instant moderatedAt;

    private Instant createdAt;

    public AdminReviewResponse(Long id, Long movieId, String movieTitle,
                               Long userId, String username,
                               String content, Integer rating,
                               Boolean isHidden, String moderatedReason, Instant moderatedAt,
                               Instant createdAt) {
        this.id = id;
        this.movieId = movieId;
        this.movieTitle = movieTitle;
        this.userId = userId;
        this.username = username;
        this.content = content;
        this.rating = rating;
        this.isHidden = isHidden;
        this.moderatedReason = moderatedReason;
        this.moderatedAt = moderatedAt;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getMovieId() { return movieId; }
    public String getMovieTitle() { return movieTitle; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getContent() { return content; }
    public Integer getRating() { return rating; }
    public Boolean getIsHidden() { return isHidden; }
    public String getModeratedReason() { return moderatedReason; }
    public Instant getModeratedAt() { return moderatedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
