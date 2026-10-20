package com.rewind.rewind.director.repo;

import com.rewind.rewind.director.entity.Director;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface DirectorRepository extends JpaRepository<Director, Long> {
    Optional<Director> findByTmdbId(Long tmdbId);
    Optional<Director> findByNameIgnoreCase(String name);
    Page<Director> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
