package com.rewind.rewind.user.dto;

import java.time.Instant;
import java.util.List;
import com.rewind.rewind.profile.dto.SocialLinkResponse;

public record PublicProfileResponse(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        Boolean hq,
        Stats stats,
        List<RatingBucket> ratingDistribution,
        List<SocialLinkResponse> socialLinks,
        List<PublicList> lists,
        List<PublicReview> recentReviews
) {
    public record Stats(long ratings, long reviews, long watched, long watchlist, long favorites) {}
    public record RatingBucket(int rating, long count) {}
    public record PublicList(Long id, String name, String description) {}
    public record PublicReview(Long id, Long movieId, String movieTitle, String content, Integer rating, Instant updatedAt) {}
}
