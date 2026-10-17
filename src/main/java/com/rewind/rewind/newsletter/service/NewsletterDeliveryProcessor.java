package com.rewind.rewind.newsletter.service;

import com.rewind.rewind.newsletter.entity.NewsletterDelivery;
import com.rewind.rewind.newsletter.entity.NewsletterDeliveryStatus;
import com.rewind.rewind.newsletter.repo.NewsletterDeliveryRepository;
import com.rewind.rewind.newsletter.repo.NewsletterSubscriptionRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsletterDeliveryProcessor {
    private final NewsletterDeliveryRepository deliveries;
    private final NewsletterSubscriptionRepository subscriptions;
    private final int maxAttempts;
    private final long retryDelaySeconds;

    public NewsletterDeliveryProcessor(NewsletterDeliveryRepository deliveries,
                                       NewsletterSubscriptionRepository subscriptions,
                                       @Value("${app.newsletter.max-attempts:5}") int maxAttempts,
                                       @Value("${app.newsletter.retry-delay-seconds:300}") long retryDelaySeconds) {
        this.deliveries = deliveries;
        this.subscriptions = subscriptions;
        this.maxAttempts = Math.max(1, Math.min(maxAttempts, 20));
        this.retryDelaySeconds = Math.max(1, retryDelaySeconds);
    }

    @Transactional
    public Optional<Message> claim(Long id) {
        if (deliveries.claim(id, NewsletterDeliveryStatus.PENDING, NewsletterDeliveryStatus.FAILED,
                NewsletterDeliveryStatus.SENDING, maxAttempts) == 0) return Optional.empty();
        NewsletterDelivery delivery = deliveries.findById(id).orElse(null);
        if (delivery == null) return Optional.empty();
        var subscription = subscriptions.findByUserId(delivery.getUser().getId()).orElse(null);
        if (subscription == null || !Boolean.TRUE.equals(subscription.getSubscribed())
                || !Boolean.TRUE.equals(delivery.getUser().getIsActive())) {
            delivery.setStatus(NewsletterDeliveryStatus.CANCELLED);
            delivery.setLastError(null);
            deliveries.save(delivery);
            return Optional.empty();
        }
        return Optional.of(new Message(delivery.getId(), delivery.getUser().getEmail(),
                "[Rewind] " + delivery.getArticle().getTitle(),
                delivery.getArticle().getContent()
                        + "\n\nOpen the Rewind journal to read more and manage your newsletter preferences."));
    }

    @Transactional
    public void markSent(Long id) {
        deliveries.findById(id).ifPresent(delivery -> {
            delivery.setStatus(NewsletterDeliveryStatus.SENT);
            delivery.setSentAt(Instant.now());
            delivery.setLastError(null);
            deliveries.save(delivery);
        });
    }

    @Transactional
    public void markFailed(Long id, Exception exception) {
        deliveries.findById(id).ifPresent(delivery -> {
            delivery.setStatus(NewsletterDeliveryStatus.FAILED);
            delivery.setAvailableAt(Instant.now().plus(retryDelaySeconds, ChronoUnit.SECONDS));
            delivery.setLastError(trimError(exception));
            deliveries.save(delivery);
        });
    }

    private String trimError(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) return exception.getClass().getSimpleName();
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }

    public record Message(Long id, String recipient, String subject, String body) {}
}
