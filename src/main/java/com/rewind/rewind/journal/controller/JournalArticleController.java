package com.rewind.rewind.journal.controller;

import com.rewind.rewind.journal.dto.JournalArticleResponse;
import com.rewind.rewind.journal.service.JournalArticleService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/journal/articles")
public class JournalArticleController {
    private final JournalArticleService service;
    public JournalArticleController(JournalArticleService service) { this.service = service; }
    @GetMapping public Page<JournalArticleResponse> list(@RequestParam(defaultValue = "uk") String language, @RequestParam(required = false) String category, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return service.publicList(language, category, page, size); }
    @GetMapping("/{slug}") public JournalArticleResponse get(@RequestParam(defaultValue = "uk") String language, @PathVariable String slug) { return service.publicGet(language, slug); }
}
