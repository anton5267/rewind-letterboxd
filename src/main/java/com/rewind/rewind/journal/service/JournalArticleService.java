package com.rewind.rewind.journal.service;

import com.rewind.rewind.journal.dto.*;
import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.journal.repo.JournalArticleRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;

@Service
public class JournalArticleService {
    private final JournalArticleRepository articles; private final UserRepository users;
    public JournalArticleService(JournalArticleRepository articles, UserRepository users) { this.articles = articles; this.users = users; }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> publicList(String language, int page, int size) {
        return publicList(language, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> publicList(String language, String category, int page, int size) {
        String lang = language.equals("en") ? "en" : "uk";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        Page<JournalArticle> result = findPublished(lang, normalizedCategory, pageable);
        if (result.isEmpty() && page == 0) result = findPublished(lang.equals("en") ? "uk" : "en", normalizedCategory, pageable);
        return result.map(this::toResponse);
    }

    private Page<JournalArticle> findPublished(String language, String category, Pageable pageable) {
        return category == null
                ? articles.findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(language, pageable)
                : articles.findAllByLanguageAndCategoryAndIsPublishedTrueOrderByPublishedAtDesc(language, category, pageable);
    }

    @Transactional(readOnly = true)
    public JournalArticleResponse publicGet(String language, String slug) {
        String lang = language.equals("en") ? "en" : "uk";
        JournalArticle article = articles.findBySlugAndLanguageAndIsPublishedTrue(slug, lang)
                .or(() -> articles.findBySlugAndLanguageAndIsPublishedTrue(slug, lang.equals("en") ? "uk" : "en"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        return toResponse(article);
    }

    @Transactional
    public JournalArticleResponse create(String adminEmail, AdminJournalArticleRequest request) {
        JournalArticle article = new JournalArticle(); apply(article, request); article.setAuthor(users.findByEmail(adminEmail).orElseThrow());
        articles.save(article); return toResponse(article);
    }

    @Transactional
    public JournalArticleResponse update(Long id, AdminJournalArticleRequest request) {
        JournalArticle article = articles.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        apply(article, request); return toResponse(article);
    }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> adminList(int page, int size) {
        return articles.findAllByOrderByUpdatedAtDesc(PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)))).map(this::toResponse);
    }

    private void apply(JournalArticle article, AdminJournalArticleRequest request) {
        article.setSlug(request.slug().trim()); article.setLanguage(request.language()); article.setCategory(request.category().trim());
        article.setTitle(request.title().trim()); article.setExcerpt(request.excerpt()); article.setContent(request.content()); article.setCoverUrl(request.coverUrl());
        article.setIsPublished(request.published()); article.setPublishedAt(request.published() ? (article.getPublishedAt() == null ? Instant.now() : article.getPublishedAt()) : null);
    }
    private JournalArticleResponse toResponse(JournalArticle a) { return new JournalArticleResponse(a.getId(), a.getSlug(), a.getLanguage(), a.getCategory(), a.getTitle(), a.getExcerpt(), a.getContent(), a.getCoverUrl(), a.getPublishedAt()); }
}
