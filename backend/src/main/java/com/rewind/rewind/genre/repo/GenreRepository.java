package com.rewind.rewind.genre.repo;

import com.rewind.rewind.genre.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    Optional<Genre> findByTmdbId(Long tmdbId);
    Optional<Genre> findByNameIgnoreCase(String name);
}
