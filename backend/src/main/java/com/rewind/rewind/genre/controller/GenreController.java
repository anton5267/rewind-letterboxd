package com.rewind.rewind.genre.controller;

import com.rewind.rewind.genre.repo.GenreRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GenreController {
    public record GenreResponse(Long id, String name) {}

    private final GenreRepository genres;

    public GenreController(GenreRepository genres) {
        this.genres = genres;
    }

    @GetMapping("/api/genres")
    public List<GenreResponse> list() {
        return genres.findAll(Sort.by("name")).stream()
                .map(genre -> new GenreResponse(genre.getId(), genre.getName()))
                .toList();
    }
}
