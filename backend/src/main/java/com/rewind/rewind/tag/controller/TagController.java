package com.rewind.rewind.tag.controller;

import com.rewind.rewind.tag.dto.TagResponse;
import com.rewind.rewind.tag.service.TagService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {
    private final TagService tags;
    public TagController(TagService tags) { this.tags = tags; }

    @GetMapping("/popular")
    public List<TagResponse> popular(@RequestParam(defaultValue = "20") int size) { return tags.popular(size); }
}
