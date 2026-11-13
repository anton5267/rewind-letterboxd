package com.rewind.rewind.journal;

import com.rewind.rewind.journal.entity.JournalArticle;
import com.rewind.rewind.journal.repo.JournalArticleRepository;
import com.rewind.rewind.journal.service.JournalArticleService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JournalArticleServiceTests {
    private final JournalArticleRepository articles = mock(JournalArticleRepository.class);
    private final JournalArticleService service = new JournalArticleService(articles, mock(UserRepository.class));

    @Test
    void authorBylineUsesDisplayNameAndFallsBackToUsername() {
        User author = new User();
        author.setIsActive(true);
        author.setUsername("writer");
        author.setDisplayName("  Display Name  ");
        JournalArticle article = new JournalArticle();
        article.setAuthor(author);
        when(articles.findBySlugAndLanguageAndIsPublishedTrue("story", "en")).thenReturn(Optional.of(article));

        assertEquals("Display Name", service.publicGet("en", "story").authorName());
        author.setDisplayName("  ");
        assertEquals("writer", service.publicGet("en", "story").authorName());
    }

    @Test
    void missingAndInactiveAuthorsLeaveTheArticleAvailableWithoutAByline() {
        JournalArticle article = new JournalArticle();
        when(articles.findBySlugAndLanguageAndIsPublishedTrue("story", "uk")).thenReturn(Optional.of(article));
        assertNull(service.publicGet("uk", "story").authorName());

        User author = new User();
        author.setIsActive(false);
        author.setUsername("inactive-writer");
        article.setAuthor(author);
        assertNull(service.publicGet("uk", "story").authorName());
    }
}
