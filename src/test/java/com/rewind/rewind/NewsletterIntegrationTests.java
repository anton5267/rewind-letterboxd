package com.rewind.rewind;

import com.rewind.rewind.journal.dto.AdminJournalArticleRequest;
import com.rewind.rewind.journal.dto.JournalArticleResponse;
import com.rewind.rewind.journal.service.JournalArticleService;
import com.rewind.rewind.newsletter.service.NewsletterSubscriptionService;
import com.rewind.rewind.newsletter.service.NewsletterDeliveryWorker;
import com.rewind.rewind.newsletter.service.NewsletterDeliveryService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
class NewsletterIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired JournalArticleService articles;
    @Autowired NewsletterSubscriptionService newsletter;
    @Autowired NewsletterDeliveryWorker deliveryWorker;
    @Autowired NewsletterDeliveryService deliveryService;
    @Autowired EntityManager entityManager;
    @MockitoBean JavaMailSender mail;

    @Test
    void subscriptionIsPrivateAndCanBeEnabledOrDisabled() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "newsletter-" + suffix + "@example.invalid";
        register("newsletter" + suffix, email);

        assertFalse(newsletter.get(email).subscribed());
        assertTrue(newsletter.set(email, true).subscribed());
        assertTrue(newsletter.get(email).subscribed());
        assertFalse(newsletter.set(email, false).subscribed());
        assertFalse(newsletter.get(email).subscribed());
    }

    @Test
    void sendsOnlyPublishedNewsletterToActiveSubscribers() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "newsletter-admin-" + suffix + "@example.invalid";
        String subscribedEmail = "newsletter-reader-" + suffix + "@example.invalid";
        String optedOutEmail = "newsletter-optout-" + suffix + "@example.invalid";
        register("newsletteradmin" + suffix, adminEmail);
        register("newsreader" + suffix, subscribedEmail);
        register("newsoptout" + suffix, optedOutEmail);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(com.rewind.rewind.user.entity.UserRole.ADMIN);
        newsletter.set(subscribedEmail, true);

        JournalArticleResponse article = articles.create(adminEmail,
                new AdminJournalArticleRequest("newsletter-" + suffix, "en", "Newsletter", "Weekly Rewind", null,
                        "New films and reviews", null, null, true));
        var result = newsletter.sendPublishedArticle(article.id());

        assertEquals(1, result.recipients());
        entityManager.flush();
        assertEquals(1, deliveryWorker.processPending());
        var message = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail, times(1)).send(message.capture());
        assertArrayEquals(new String[]{subscribedEmail}, message.getValue().getTo());
        assertTrue(message.getValue().getText().contains("New films and reviews"));
        assertEquals(1, deliveryService.status(article.id()).sent());
        assertEquals(0, newsletter.sendPublishedArticle(article.id()).recipients(),
                "Re-queueing an already queued article must be idempotent");
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username); request.setEmail(email); request.setPassword("test-password-123");
        users.register(request);
    }
}
