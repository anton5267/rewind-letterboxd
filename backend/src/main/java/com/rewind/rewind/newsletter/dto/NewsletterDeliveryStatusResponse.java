package com.rewind.rewind.newsletter.dto;

public record NewsletterDeliveryStatusResponse(Long articleId, long pending, long sending,
                                               long sent, long failed, long cancelled) {}
