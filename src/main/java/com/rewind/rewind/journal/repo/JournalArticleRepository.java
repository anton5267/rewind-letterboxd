package com.rewind.rewind.journal.repo;

import com.rewind.rewind.journal.entity.JournalArticle;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;

public interface JournalArticleRepository extends JpaRepository<JournalArticle, Long> {
    Page<JournalArticle> findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(String language, Pageable pageable);
    Page<JournalArticle> findAllByLanguageAndCategoryAndIsPublishedTrueOrderByPublishedAtDesc(String language, String category, Pageable pageable);
    Page<JournalArticle> findAllByLanguageAndIsPublishedTrueAndPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(String language, Instant from, Instant to, Pageable pageable);
    Page<JournalArticle> findAllByLanguageAndCategoryAndIsPublishedTrueAndPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(String language, String category, Instant from, Instant to, Pageable pageable);
    java.util.List<JournalArticle> findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(String language);
    Optional<JournalArticle> findBySlugAndLanguageAndIsPublishedTrue(String slug, String language);
    Page<JournalArticle> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
