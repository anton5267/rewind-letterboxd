package com.rewind.rewind.newsletter.service;

import com.rewind.rewind.newsletter.dto.NewsletterSendResponse;
import com.rewind.rewind.newsletter.dto.NewsletterSubscriptionResponse;
import com.rewind.rewind.newsletter.entity.NewsletterSubscription;
import com.rewind.rewind.newsletter.repo.NewsletterSubscriptionRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NewsletterSubscriptionService {
    private final NewsletterSubscriptionRepository subscriptions;
    private final UserRepository users;
    private final NewsletterDeliveryService delivery;

    public NewsletterSubscriptionService(NewsletterSubscriptionRepository subscriptions,
                                         UserRepository users,
                                         NewsletterDeliveryService delivery) {
        this.subscriptions = subscriptions;
        this.users = users;
        this.delivery = delivery;
    }

    @Transactional(readOnly = true)
    public NewsletterSubscriptionResponse get(String email) {
        User user = user(email);
        return new NewsletterSubscriptionResponse(subscriptions.findByUserId(user.getId())
                .map(item -> Boolean.TRUE.equals(item.getSubscribed())).orElse(false));
    }

    @Transactional
    public NewsletterSubscriptionResponse set(String email, boolean subscribed) {
        User user = user(email);
        NewsletterSubscription item = subscriptions.findByUserId(user.getId()).orElseGet(() -> {
            NewsletterSubscription created = new NewsletterSubscription();
            created.setUser(user);
            return created;
        });
        item.setSubscribed(subscribed);
        item.setSubscribedAt(subscribed ? Instant.now() : null);
        subscriptions.save(item);
        return new NewsletterSubscriptionResponse(subscribed);
    }

    @Transactional
    public NewsletterSendResponse sendPublishedArticle(Long articleId) {
        return delivery.queuePublishedArticle(articleId);
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
