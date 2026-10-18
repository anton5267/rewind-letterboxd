package com.rewind.rewind;

import com.rewind.rewind.journal.dto.AdminJournalArticleRequest;
import com.rewind.rewind.journal.service.JournalArticleService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.UUID;
import java.time.YearMonth;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JournalArticleIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired JournalArticleService articles;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void publishedJournalArticleIsPublicInItsLanguageAndDraftIsNot() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "journal-admin-" + suffix + "@example.invalid";
        UserRegisterRequest register = new UserRegisterRequest();
        register.setUsername("journal-admin-" + suffix); register.setEmail(adminEmail); register.setPassword("test-password-123");
        users.register(register);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(UserRole.ADMIN);

        String audioUrl = "https://cdn.example.invalid/rewind-" + suffix + ".mp3";
        AdminJournalArticleRequest published = new AdminJournalArticleRequest("rewind-news-" + suffix, "uk", "Новини", "Тестова стаття", "Коротко", "Повний текст", null, audioUrl, true);
        articles.create(adminEmail, published);
        AdminJournalArticleRequest draft = new AdminJournalArticleRequest("draft-" + suffix, "en", "News", "Draft", null, "Hidden", null, null, false);
        articles.create(adminEmail, draft);

        assertEquals(1, articles.publicList("uk", 0, 20).getTotalElements());
        assertEquals(1, articles.publicList("uk", "Новини", 0, 20).getTotalElements());
        assertEquals(0, articles.publicList("uk", "Подкасти", 0, 20).getTotalElements());
        assertEquals(1, articles.publicArchive("uk").stream().mapToLong(item -> item.articleCount()).sum());
        YearMonth publishedMonth = YearMonth.now(java.time.ZoneOffset.UTC);
        assertEquals(1, articles.publicList("uk", null, publishedMonth.getYear(), publishedMonth.getMonthValue(), 0, 20).getTotalElements());
        assertEquals("Тестова стаття", articles.publicGet("uk", published.slug()).title());
        assertEquals(audioUrl, articles.publicGet("uk", published.slug()).audioUrl());
        assertEquals(1, articles.publicList("en", 0, 20).getTotalElements());
        assertEquals("Тестова стаття", articles.publicGet("en", published.slug()).title());
    }

    @Test
    @Transactional
    void journalListFallsBackPerSlugWithoutDroppingMixedLanguageArticles() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "journal-fallback-" + suffix + "@example.invalid";
        UserRegisterRequest register = new UserRegisterRequest();
        register.setUsername("journal-fallback-" + suffix);
        register.setEmail(adminEmail);
        register.setPassword("test-password-123");
        users.register(register);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(UserRole.ADMIN);

        var fallbackOnly = new AdminJournalArticleRequest("fallback-only-" + suffix, "uk", "Новини",
                "Український fallback", null, "Fallback content", null, null, true);
        var ukTranslation = new AdminJournalArticleRequest("translated-" + suffix, "uk", "Новини",
                "Українська версія", null, "Український текст", null, null, true);
        var enTranslation = new AdminJournalArticleRequest("translated-" + suffix, "en", "News",
                "English version", null, "English text", null, null, true);
        articles.create(adminEmail, fallbackOnly);
        articles.create(adminEmail, ukTranslation);
        articles.create(adminEmail, enTranslation);

        var english = articles.publicList("en", 0, 20);
        assertEquals(2, english.getTotalElements());
        assertTrue(english.getContent().stream().anyMatch(item -> item.title().equals("Український fallback")));
        assertTrue(english.getContent().stream().anyMatch(item -> item.title().equals("English version")));
        assertEquals(2, articles.publicArchive("en").stream().mapToLong(item -> item.articleCount()).sum());
    }

    @Test
    @Transactional
    void adminArticlePagesAreStableWhenUpdatedAtTies() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "journal-pages-" + suffix + "@example.invalid";
        UserRegisterRequest register = new UserRegisterRequest();
        register.setUsername("journal-pages-" + suffix);
        register.setEmail(adminEmail);
        register.setPassword("test-password-123");
        users.register(register);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(UserRole.ADMIN);
        long totalBefore = articles.adminList(0, 1).getTotalElements();

        var created = new ArrayList<Long>();
        for (int index = 0; index < 51; index++) {
            var request = new AdminJournalArticleRequest("page-" + suffix + "-" + index, "uk", "Новини",
                    "Page article " + index, null, "Pagination fixture", null, null, false);
            created.add(articles.create(adminEmail, request).id());
        }
        Instant tiedAt = Instant.parse("2026-10-18T00:00:00Z");
        for (Long id : created) {
            jdbc.update("update journal_articles set updated_at = ? where id = ?", Timestamp.from(tiedAt), id);
        }

        var firstPage = articles.adminList(0, 50);
        var expectedIds = new HashSet<>(created);
        var actualIds = new HashSet<Long>();
        for (int page = 0; page < firstPage.getTotalPages(); page++) {
            articles.adminList(page, 50).forEach(item -> {
                if (expectedIds.contains(item.id())) actualIds.add(item.id());
            });
        }

        assertEquals(totalBefore + 51, firstPage.getTotalElements());
        assertEquals(50, firstPage.getNumberOfElements());
        assertEquals(expectedIds, actualIds, "Admin article pages must neither omit nor repeat equal-timestamp rows");
    }
}
