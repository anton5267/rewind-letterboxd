package com.rewind.rewind.message.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateConversationRequest(@NotNull @Positive Long userId) {}
