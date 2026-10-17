package com.rewind.rewind.director.repo;

import com.rewind.rewind.director.entity.Director;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DirectorRepository extends JpaRepository<Director, Long> {
    Optional<Director> findByTmdbId(Long tmdbId);
    Optional<Director> findByNameIgnoreCase(String name);
}
