package com.rewind.rewind.journal.controller;

import com.rewind.rewind.journal.dto.JournalArticleResponse;
import com.rewind.rewind.journal.dto.JournalArchiveEntry;
import com.rewind.rewind.journal.service.JournalArticleService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/journal/articles")
public class JournalArticleController {
    private final JournalArticleService service;
    public JournalArticleController(JournalArticleService service) { this.service = service; }
    @GetMapping public Page<JournalArticleResponse> list(@RequestParam(defaultValue = "uk") String language, @RequestParam(required = false) String category, @RequestParam(required = false) Integer year, @RequestParam(required = false) Integer month, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return service.publicList(language, category, year, month, page, size); }
    @GetMapping("/archive") public List<JournalArchiveEntry> archive(@RequestParam(defaultValue = "uk") String language) { return service.publicArchive(language); }
    @GetMapping("/{slug}") public JournalArticleResponse get(@RequestParam(defaultValue = "uk") String language, @PathVariable String slug) { return service.publicGet(language, slug); }
}
