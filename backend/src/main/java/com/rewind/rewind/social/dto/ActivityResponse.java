package com.rewind.rewind.social.dto;

import com.rewind.rewind.social.entity.ActivityType;

import java.time.Instant;

public record ActivityResponse(
        Long id,
        ActivityType type,
        Instant createdAt,
        Actor actor,
        Movie movie,
        RelatedUser relatedUser,
        ListInfo list
) {
    public record Actor(Long id, String username, String displayName, String avatarUrl) {}
    public record Movie(Long id, String title) {}
    public record RelatedUser(Long id, String username, String displayName) {}
    public record ListInfo(Long id, String name) {}
}
