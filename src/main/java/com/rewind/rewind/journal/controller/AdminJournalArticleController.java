package com.rewind.rewind.journal.controller;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.journal.dto.*;
import com.rewind.rewind.journal.service.JournalArticleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/journal/articles")
public class AdminJournalArticleController {
    private final JournalArticleService service; private final AdminAuditLogService audit;
    public AdminJournalArticleController(JournalArticleService service, AdminAuditLogService audit) { this.service = service; this.audit = audit; }
    @GetMapping public Page<JournalArticleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "0") int size) { return service.adminList(page, size == 0 ? 50 : size); }
    @PostMapping public JournalArticleResponse create(Authentication auth, @Valid @RequestBody AdminJournalArticleRequest request) { JournalArticleResponse result = service.create(auth.getName(), request); audit.record(auth.getName(), "JOURNAL_ARTICLE_CREATED", "JOURNAL_ARTICLE", result.id(), result.language()); return result; }
    @PutMapping("/{id}") public JournalArticleResponse update(Authentication auth, @PathVariable Long id, @Valid @RequestBody AdminJournalArticleRequest request) { JournalArticleResponse result = service.update(id, request); audit.record(auth.getName(), "JOURNAL_ARTICLE_UPDATED", "JOURNAL_ARTICLE", id, result.language()); return result; }
}
