package com.rewind.rewind.producer.repo;

import com.rewind.rewind.producer.entity.Producer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface ProducerRepository extends JpaRepository<Producer, Long> {
    Optional<Producer> findByTmdbId(Long tmdbId);
    Optional<Producer> findByNameIgnoreCase(String name);
    Page<Producer> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
