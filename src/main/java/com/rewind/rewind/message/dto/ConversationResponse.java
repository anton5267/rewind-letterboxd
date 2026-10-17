package com.rewind.rewind.message.dto;

import java.time.Instant;

public record ConversationResponse(Long id, PublicUser otherUser, Instant updatedAt, MessageSummary lastMessage) {
    public record PublicUser(Long id, String username, String displayName, String avatarUrl) {}
    public record MessageSummary(Long id, Long senderId, String body, Instant createdAt, Instant readAt) {}
}
