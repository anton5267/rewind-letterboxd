package com.rewind.rewind.newsletter.dto;

import jakarta.validation.constraints.NotNull;

public record NewsletterSubscriptionRequest(@NotNull Boolean subscribed) {}
