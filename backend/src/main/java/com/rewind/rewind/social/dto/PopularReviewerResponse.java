package com.rewind.rewind.social.dto;

public record PopularReviewerResponse(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        long likes,
        long reviewCount,
        long watchedCount,
        long listCount
) {}
