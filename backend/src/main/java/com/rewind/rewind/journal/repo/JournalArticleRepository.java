package com.rewind.rewind.journal.repo;

import com.rewind.rewind.journal.entity.JournalArticle;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;

public interface JournalArticleRepository extends JpaRepository<JournalArticle, Long> {
    @Query(value = "select a from JournalArticle a where a.isPublished = true "
            + "and (a.language = :language or (a.language = :fallback and not exists "
            + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
            + "and preferred.language = :language and preferred.isPublished = true))) "
            + "and (:category is null or a.category = :category) "
            + "order by a.publishedAt desc, a.id desc",
            countQuery = "select count(a) from JournalArticle a where a.isPublished = true "
                    + "and (a.language = :language or (a.language = :fallback and not exists "
                    + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
                    + "and preferred.language = :language and preferred.isPublished = true))) "
                    + "and (:category is null or a.category = :category)")
    Page<JournalArticle> findPublishedWithFallback(@Param("language") String language, @Param("fallback") String fallback,
                                                    @Param("category") String category, Pageable pageable);

    @Query(value = "select a from JournalArticle a where a.isPublished = true "
            + "and (a.language = :language or (a.language = :fallback and not exists "
            + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
            + "and preferred.language = :language and preferred.isPublished = true))) "
            + "and (lower(a.title) like lower(concat('%', :q, '%')) "
            + "or lower(coalesce(a.excerpt, '')) like lower(concat('%', :q, '%')) "
            + "or lower(a.category) like lower(concat('%', :q, '%'))) "
            + "order by a.publishedAt desc, a.id desc",
            countQuery = "select count(a) from JournalArticle a where a.isPublished = true "
                    + "and (a.language = :language or (a.language = :fallback and not exists "
                    + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
                    + "and preferred.language = :language and preferred.isPublished = true))) "
                    + "and (lower(a.title) like lower(concat('%', :q, '%')) "
                    + "or lower(coalesce(a.excerpt, '')) like lower(concat('%', :q, '%')) "
                    + "or lower(a.category) like lower(concat('%', :q, '%')))" )
    Page<JournalArticle> searchPublishedWithFallback(@Param("language") String language, @Param("fallback") String fallback,
                                                     @Param("q") String q, Pageable pageable);

    @Query(value = "select a from JournalArticle a where a.isPublished = true "
            + "and (a.language = :language or (a.language = :fallback and not exists "
            + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
            + "and preferred.language = :language and preferred.isPublished = true))) "
            + "and (:category is null or a.category = :category) "
            + "and a.publishedAt >= :from and a.publishedAt < :to "
            + "order by a.publishedAt desc, a.id desc",
            countQuery = "select count(a) from JournalArticle a where a.isPublished = true "
                    + "and (a.language = :language or (a.language = :fallback and not exists "
                    + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
                    + "and preferred.language = :language and preferred.isPublished = true))) "
                    + "and (:category is null or a.category = :category) "
                    + "and a.publishedAt >= :from and a.publishedAt < :to")
    Page<JournalArticle> findPublishedWithFallbackInRange(@Param("language") String language, @Param("fallback") String fallback,
                                                           @Param("category") String category, @Param("from") Instant from,
                                                           @Param("to") Instant to, Pageable pageable);

    @Query("select a from JournalArticle a where a.isPublished = true "
            + "and (a.language = :language or (a.language = :fallback and not exists "
            + "(select preferred.id from JournalArticle preferred where preferred.slug = a.slug "
            + "and preferred.language = :language and preferred.isPublished = true))) "
            + "order by a.publishedAt desc, a.id desc")
    java.util.List<JournalArticle> findAllPublishedWithFallback(@Param("language") String language, @Param("fallback") String fallback);
    Optional<JournalArticle> findBySlugAndLanguageAndIsPublishedTrue(String slug, String language);
    Page<JournalArticle> findAllByOrderByUpdatedAtDescIdDesc(Pageable pageable);
}
