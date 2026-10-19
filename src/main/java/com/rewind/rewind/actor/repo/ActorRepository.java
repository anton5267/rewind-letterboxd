package com.rewind.rewind.actor.repo;

import com.rewind.rewind.actor.entity.Actor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ActorRepository extends JpaRepository<Actor, Long> {
    Optional<Actor> findByTmdbId(Long tmdbId);
    Optional<Actor> findByNameIgnoreCase(String name);
    Page<Actor> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
