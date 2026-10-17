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
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.TreeMap;
import java.util.List;

@Service
public class JournalArticleService {
    private final JournalArticleRepository articles; private final UserRepository users;
    public JournalArticleService(JournalArticleRepository articles, UserRepository users) { this.articles = articles; this.users = users; }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> publicList(String language, int page, int size) {
        return publicList(language, null, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> publicList(String language, String category, int page, int size) {
        return publicList(language, category, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<JournalArticleResponse> publicList(String language, String category, Integer year, Integer month, int page, int size) {
        String lang = language.equals("en") ? "en" : "uk";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        YearMonth archiveMonth = archiveMonth(year, month);
        Page<JournalArticle> result = findPublished(lang, normalizedCategory, archiveMonth, pageable);
        if (result.isEmpty() && page == 0) result = findPublished(lang.equals("en") ? "uk" : "en", normalizedCategory, archiveMonth, pageable);
        return result.map(this::toResponse);
    }

    private Page<JournalArticle> findPublished(String language, String category, YearMonth archiveMonth, Pageable pageable) {
        if (archiveMonth == null) {
            return category == null
                    ? articles.findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(language, pageable)
                    : articles.findAllByLanguageAndCategoryAndIsPublishedTrueOrderByPublishedAtDesc(language, category, pageable);
        }
        Instant from = archiveMonth.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = archiveMonth.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return category == null
                ? articles.findAllByLanguageAndIsPublishedTrueAndPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(language, from, to, pageable)
                : articles.findAllByLanguageAndCategoryAndIsPublishedTrueAndPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(language, category, from, to, pageable);
    }

    private YearMonth archiveMonth(Integer year, Integer month) {
        if (year == null && month == null) return null;
        if (year == null || month == null || year < 1900 || year > 9999 || month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid archive month");
        }
        return YearMonth.of(year, month);
    }

    @Transactional(readOnly = true)
    public List<JournalArchiveEntry> publicArchive(String language) {
        String lang = language.equals("en") ? "en" : "uk";
        List<JournalArticle> published = articles.findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(lang);
        if (published.isEmpty()) published = articles.findAllByLanguageAndIsPublishedTrueOrderByPublishedAtDesc(lang.equals("en") ? "uk" : "en");
        Map<YearMonth, Long> grouped = new TreeMap<>((a, b) -> b.compareTo(a));
        for (JournalArticle article : published) {
            if (article.getPublishedAt() != null) {
                YearMonth month = YearMonth.from(article.getPublishedAt().atZone(java.time.ZoneOffset.UTC));
                grouped.merge(month, 1L, (left, right) -> left + right);
            }
        }
        return grouped.entrySet().stream().map(entry -> new JournalArchiveEntry(entry.getKey().getYear(), entry.getKey().getMonthValue(), entry.getValue())).toList();
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
        article.setTitle(request.title().trim()); article.setExcerpt(request.excerpt()); article.setContent(request.content()); article.setCoverUrl(request.coverUrl()); article.setAudioUrl(request.audioUrl());
        article.setIsPublished(request.published()); article.setPublishedAt(request.published() ? (article.getPublishedAt() == null ? Instant.now() : article.getPublishedAt()) : null);
    }
    private JournalArticleResponse toResponse(JournalArticle a) { return new JournalArticleResponse(a.getId(), a.getSlug(), a.getLanguage(), a.getCategory(), a.getTitle(), a.getExcerpt(), a.getContent(), a.getCoverUrl(), a.getAudioUrl(), a.getPublishedAt()); }
}
