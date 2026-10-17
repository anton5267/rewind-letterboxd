package com.rewind.rewind.newsletter.service;

import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.journal.repo.JournalArticleRepository;
import com.rewind.rewind.newsletter.dto.NewsletterSendResponse;
import com.rewind.rewind.newsletter.dto.NewsletterSubscriptionResponse;
import com.rewind.rewind.newsletter.entity.NewsletterSubscription;
import com.rewind.rewind.newsletter.repo.NewsletterSubscriptionRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NewsletterSubscriptionService {
    private final NewsletterSubscriptionRepository subscriptions;
    private final UserRepository users;
    private final JournalArticleRepository articles;
    private final JavaMailSender mail;

    public NewsletterSubscriptionService(NewsletterSubscriptionRepository subscriptions,
                                         UserRepository users,
                                         JournalArticleRepository articles,
                                         JavaMailSender mail) {
        this.subscriptions = subscriptions;
        this.users = users;
        this.articles = articles;
        this.mail = mail;
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
        JournalArticle article = articles.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        if (!Boolean.TRUE.equals(article.getIsPublished()) || !isNewsletter(article.getCategory())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only published Newsletter articles can be sent");
        }
        int sent = 0;
        for (NewsletterSubscription subscription : subscriptions.findAllBySubscribedTrueAndUserIsActiveTrue()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(subscription.getUser().getEmail());
            message.setSubject("[Rewind] " + article.getTitle());
            message.setText(article.getContent() + "\n\nOpen the Rewind journal to read more and manage your newsletter preferences.");
            mail.send(message);
            sent++;
        }
        return new NewsletterSendResponse(article.getId(), sent);
    }

    private boolean isNewsletter(String category) {
        if (category == null) return false;
        return category.trim().equalsIgnoreCase("newsletter") || category.trim().equalsIgnoreCase("бюлетень");
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
