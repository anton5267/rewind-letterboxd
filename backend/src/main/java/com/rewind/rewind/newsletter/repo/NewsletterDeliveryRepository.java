package com.rewind.rewind.newsletter.repo;

import com.rewind.rewind.newsletter.entity.NewsletterDelivery;
import com.rewind.rewind.newsletter.entity.NewsletterDeliveryStatus;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsletterDeliveryRepository extends JpaRepository<NewsletterDelivery, Long> {
    boolean existsByArticleIdAndUserId(Long articleId, Long userId);

    @Query("select d.id from NewsletterDelivery d where "
            + "(d.status = :pending or (d.status = :failed and d.attempts < :maxAttempts)) "
            + "and d.availableAt <= CURRENT_TIMESTAMP order by d.id")
    List<Long> findReadyIds(@Param("pending") NewsletterDeliveryStatus pending,
                            @Param("failed") NewsletterDeliveryStatus failed,
                            @Param("maxAttempts") int maxAttempts,
                            Pageable pageable);

    @Modifying
    @Query("update NewsletterDelivery d set d.status = :sending, d.attempts = d.attempts + 1, d.updatedAt = CURRENT_TIMESTAMP "
            + "where d.id = :id and (d.status = :pending or (d.status = :failed and d.attempts < :maxAttempts)) "
            + "and d.availableAt <= CURRENT_TIMESTAMP")
    int claim(@Param("id") Long id,
              @Param("pending") NewsletterDeliveryStatus pending,
              @Param("failed") NewsletterDeliveryStatus failed,
              @Param("sending") NewsletterDeliveryStatus sending,
              @Param("maxAttempts") int maxAttempts);

    long countByArticleIdAndStatus(Long articleId, NewsletterDeliveryStatus status);
}
