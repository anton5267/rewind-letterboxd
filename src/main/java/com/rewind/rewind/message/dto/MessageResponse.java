package com.rewind.rewind.message.dto;

import java.time.Instant;

public record MessageResponse(Long id, Long conversationId, Long senderId, String body, Instant createdAt, Instant readAt) {}
