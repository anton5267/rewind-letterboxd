package com.rewind.rewind.newsletter.service;

import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.journal.repo.JournalArticleRepository;
import com.rewind.rewind.newsletter.dto.NewsletterDeliveryStatusResponse;
import com.rewind.rewind.newsletter.dto.NewsletterSendResponse;
import com.rewind.rewind.newsletter.entity.NewsletterDelivery;
import com.rewind.rewind.newsletter.entity.NewsletterDeliveryStatus;
import com.rewind.rewind.newsletter.entity.NewsletterSubscription;
import com.rewind.rewind.newsletter.repo.NewsletterDeliveryRepository;
import com.rewind.rewind.newsletter.repo.NewsletterSubscriptionRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NewsletterDeliveryService {
    private final NewsletterDeliveryRepository deliveries;
    private final NewsletterSubscriptionRepository subscriptions;
    private final JournalArticleRepository articles;

    public NewsletterDeliveryService(NewsletterDeliveryRepository deliveries,
                                     NewsletterSubscriptionRepository subscriptions,
                                     JournalArticleRepository articles) {
        this.deliveries = deliveries;
        this.subscriptions = subscriptions;
        this.articles = articles;
    }

    @Transactional
    public NewsletterSendResponse queuePublishedArticle(Long articleId) {
        JournalArticle article = publishedNewsletterArticle(articleId);
        int queued = 0;
        for (NewsletterSubscription subscription : subscriptions.findAllBySubscribedTrueAndUserIsActiveTrue()) {
            Long userId = subscription.getUser().getId();
            if (deliveries.existsByArticleIdAndUserId(article.getId(), userId)) continue;
            NewsletterDelivery delivery = new NewsletterDelivery();
            delivery.setArticle(article);
            delivery.setUser(subscription.getUser());
            delivery.setAvailableAt(Instant.now());
            deliveries.save(delivery);
            queued++;
        }
        return new NewsletterSendResponse(article.getId(), queued);
    }

    @Transactional(readOnly = true)
    public NewsletterDeliveryStatusResponse status(Long articleId) {
        if (!articles.existsById(articleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found");
        }
        return new NewsletterDeliveryStatusResponse(articleId,
                deliveries.countByArticleIdAndStatus(articleId, NewsletterDeliveryStatus.PENDING),
                deliveries.countByArticleIdAndStatus(articleId, NewsletterDeliveryStatus.SENDING),
                deliveries.countByArticleIdAndStatus(articleId, NewsletterDeliveryStatus.SENT),
                deliveries.countByArticleIdAndStatus(articleId, NewsletterDeliveryStatus.FAILED),
                deliveries.countByArticleIdAndStatus(articleId, NewsletterDeliveryStatus.CANCELLED));
    }

    JournalArticle publishedNewsletterArticle(Long articleId) {
        JournalArticle article = articles.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        if (!Boolean.TRUE.equals(article.getIsPublished()) || !isNewsletter(article.getCategory())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only published Newsletter articles can be sent");
        }
        return article;
    }

    private boolean isNewsletter(String category) {
        if (category == null) return false;
        return category.trim().equalsIgnoreCase("newsletter") || category.trim().equalsIgnoreCase("бюлетень");
    }
}
