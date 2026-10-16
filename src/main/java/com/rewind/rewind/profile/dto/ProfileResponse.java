package com.rewind.rewind.profile.dto;

import com.rewind.rewind.list.entity.ListType;

import java.time.Instant;
import java.util.List;

public class ProfileResponse {

    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String role;
    private String avatarUrl;

    private List<ProfileListItem> lists;
    private List<ProfileRatingItem> recentRatings;
    private List<ProfileReviewItem> recentReviews;

    public ProfileResponse(
            Long id,
            String username,
            String displayName,
            String email,
            String role,
            String avatarUrl,
            List<ProfileListItem> lists,
            List<ProfileRatingItem> recentRatings,
            List<ProfileReviewItem> recentReviews
    ) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.email = email;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.lists = lists;
        this.recentRatings = recentRatings;
        this.recentReviews = recentReviews;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; } // <-- ОЦЕ ДОДАЛИ
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getAvatarUrl() { return avatarUrl; }
    public List<ProfileListItem> getLists() { return lists; }
    public List<ProfileRatingItem> getRecentRatings() { return recentRatings; }
    public List<ProfileReviewItem> getRecentReviews() { return recentReviews; }

    public static class ProfileListItem {
        private Long id;
        private String name;
        private ListType listType;
        private Boolean isPublic;

        public ProfileListItem(Long id, String name, ListType listType, Boolean isPublic) {
            this.id = id;
            this.name = name;
            this.listType = listType;
            this.isPublic = isPublic;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public ListType getListType() { return listType; }
        public Boolean getIsPublic() { return isPublic; }
    }

    public static class ProfileRatingItem {
        private Long movieId;
        private String movieTitle;
        private String moviePhotoUrl;
        private Integer rating; // 1..5
        private Instant updatedAt;

        public ProfileRatingItem(Long movieId, String movieTitle, String moviePhotoUrl, Integer rating, Instant updatedAt) {
            this.movieId = movieId;
            this.movieTitle = movieTitle;
            this.moviePhotoUrl = moviePhotoUrl;
            this.rating = rating;
            this.updatedAt = updatedAt;
        }

        public Long getMovieId() { return movieId; }
        public String getMovieTitle() { return movieTitle; }
        public String getMoviePhotoUrl() { return moviePhotoUrl; }
        public Integer getRating() { return rating; }
        public Instant getUpdatedAt() { return updatedAt; }
    }

    public static class ProfileReviewItem {
        private Long reviewId;
        private Long movieId;
        private String movieTitle;
        private String content;
        private Instant updatedAt;

        public ProfileReviewItem(Long reviewId, Long movieId, String movieTitle, String content, Instant updatedAt) {
            this.reviewId = reviewId;
            this.movieId = movieId;
            this.movieTitle = movieTitle;
            this.content = content;
            this.updatedAt = updatedAt;
        }

        public Long getReviewId() { return reviewId; }
        public Long getMovieId() { return movieId; }
        public String getMovieTitle() { return movieTitle; }
        public String getContent() { return content; }
        public Instant getUpdatedAt() { return updatedAt; }
    }
}
