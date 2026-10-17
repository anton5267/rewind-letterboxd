package com.rewind.rewind.admin.dto;

import java.time.Instant;

public record AdminConversationResponse(
        Long id,
        Long userOneId,
        Long userTwoId,
        long messageCount,
        Instant createdAt,
        Instant updatedAt,
        Instant lastMessageAt
) {}
