package com.rewind.rewind.notification.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferencesRequest(@NotNull Boolean followsEnabled, @NotNull Boolean reviewLikesEnabled) {}
