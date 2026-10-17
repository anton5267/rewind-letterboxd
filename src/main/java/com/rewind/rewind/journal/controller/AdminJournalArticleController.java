package com.rewind.rewind.journal.controller;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.journal.dto.*;
import com.rewind.rewind.journal.service.JournalArticleService;
import com.rewind.rewind.newsletter.dto.NewsletterSendResponse;
import com.rewind.rewind.newsletter.service.NewsletterSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/journal/articles")
public class AdminJournalArticleController {
    private final JournalArticleService service; private final AdminAuditLogService audit; private final NewsletterSubscriptionService newsletter;
    public AdminJournalArticleController(JournalArticleService service, AdminAuditLogService audit, NewsletterSubscriptionService newsletter) { this.service = service; this.audit = audit; this.newsletter = newsletter; }
    @GetMapping public Page<JournalArticleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "0") int size) { return service.adminList(page, size == 0 ? 50 : size); }
    @PostMapping public JournalArticleResponse create(Authentication auth, @Valid @RequestBody AdminJournalArticleRequest request) { JournalArticleResponse result = service.create(auth.getName(), request); audit.record(auth.getName(), "JOURNAL_ARTICLE_CREATED", "JOURNAL_ARTICLE", result.id(), result.language()); return result; }
    @PutMapping("/{id}") public JournalArticleResponse update(Authentication auth, @PathVariable Long id, @Valid @RequestBody AdminJournalArticleRequest request) { JournalArticleResponse result = service.update(id, request); audit.record(auth.getName(), "JOURNAL_ARTICLE_UPDATED", "JOURNAL_ARTICLE", id, result.language()); return result; }
    @PostMapping("/{id}/newsletter") public NewsletterSendResponse sendNewsletter(Authentication auth, @PathVariable Long id) { NewsletterSendResponse result = newsletter.sendPublishedArticle(id); audit.record(auth.getName(), "JOURNAL_NEWSLETTER_SENT", "JOURNAL_ARTICLE", id, "recipients=" + result.recipients()); return result; }
}
