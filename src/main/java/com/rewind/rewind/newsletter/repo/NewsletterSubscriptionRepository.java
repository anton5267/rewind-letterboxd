package com.rewind.rewind.newsletter.repo;

import com.rewind.rewind.newsletter.entity.NewsletterSubscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {
    Optional<NewsletterSubscription> findByUserId(Long userId);
    List<NewsletterSubscription> findAllBySubscribedTrueAndUserIsActiveTrue();
}
