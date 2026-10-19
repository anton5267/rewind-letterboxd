package com.rewind.rewind.review.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ReviewDetailsResponse(
        Long id,
        String content,
        Integer rating,
        Instant createdAt,
        Author author,
        Movie movie,
        long likes,
        List<Liker> likedBy
) {
    public record Author(Long id, String username, String displayName, String avatarUrl) {}

    public record Movie(
            Long id,
            String title,
            LocalDate releaseDate,
            Integer durationMinutes,
            String ageRating,
            String photoUrl,
            String backdropUrl,
            String trailerUrl
    ) {}

    public record Liker(Long id, String username, String displayName, String avatarUrl) {}
}
