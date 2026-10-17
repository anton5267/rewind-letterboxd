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
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.time.YearMonth;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JournalArticleIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired JournalArticleService articles;

    @Test
    @Transactional
    void publishedJournalArticleIsPublicInItsLanguageAndDraftIsNot() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "journal-admin-" + suffix + "@example.invalid";
        UserRegisterRequest register = new UserRegisterRequest();
        register.setUsername("journal-admin-" + suffix); register.setEmail(adminEmail); register.setPassword("test-password-123");
        users.register(register);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(UserRole.ADMIN);

        AdminJournalArticleRequest published = new AdminJournalArticleRequest("rewind-news-" + suffix, "uk", "Новини", "Тестова стаття", "Коротко", "Повний текст", null, true);
        articles.create(adminEmail, published);
        AdminJournalArticleRequest draft = new AdminJournalArticleRequest("draft-" + suffix, "en", "News", "Draft", null, "Hidden", null, false);
        articles.create(adminEmail, draft);

        assertEquals(1, articles.publicList("uk", 0, 20).getTotalElements());
        assertEquals(1, articles.publicList("uk", "Новини", 0, 20).getTotalElements());
        assertEquals(0, articles.publicList("uk", "Подкасти", 0, 20).getTotalElements());
        assertEquals(1, articles.publicArchive("uk").stream().mapToLong(item -> item.articleCount()).sum());
        YearMonth publishedMonth = YearMonth.now(java.time.ZoneOffset.UTC);
        assertEquals(1, articles.publicList("uk", null, publishedMonth.getYear(), publishedMonth.getMonthValue(), 0, 20).getTotalElements());
        assertEquals("Тестова стаття", articles.publicGet("uk", published.slug()).title());
        assertEquals(1, articles.publicList("en", 0, 20).getTotalElements());
        assertEquals("Тестова стаття", articles.publicGet("en", published.slug()).title());
    }
}
