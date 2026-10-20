package com.rewind.rewind.search.controller;

import com.rewind.rewind.search.dto.GlobalSearchResponse;
import com.rewind.rewind.search.service.GlobalSearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class GlobalSearchController {
    private final GlobalSearchService service;

    public GlobalSearchController(GlobalSearchService service) {
        this.service = service;
    }

    @GetMapping("/global")
    public GlobalSearchResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "uk") String language,
            @RequestParam(defaultValue = "6") int size
    ) {
        return service.search(q, language, size);
    }
}
