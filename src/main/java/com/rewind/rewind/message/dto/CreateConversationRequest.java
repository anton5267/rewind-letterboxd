package com.rewind.rewind.message.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(@NotNull Long userId) {}
