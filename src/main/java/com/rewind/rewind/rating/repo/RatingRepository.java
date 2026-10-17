package com.rewind.rewind.rating.repo;

import com.rewind.rewind.rating.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndMovieId(Long userId, Long movieId);
    @EntityGraph(attributePaths = "movie")
    Page<Rating> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    void deleteByUserIdAndMovieId(Long userId, Long movieId);
}
