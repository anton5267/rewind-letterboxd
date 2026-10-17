package com.rewind.rewind.review.repo;

import com.rewind.rewind.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findAllByMovieId(Long movieId, Pageable pageable);
    @EntityGraph(attributePaths = "movie")
    Page<Review> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    @EntityGraph(attributePaths = "user")
    Page<Review> findAllByMovieIdAndIsHiddenFalse(Long movieId, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByIsHiddenFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<Review> findAllByIsHidden(Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Page<Review> findAllByModeratedAtIsNullOrderByCreatedAtAsc(Pageable pageable);
    long countByModeratedAtIsNull();
    Page<Review> findAllByMovieIdAndIsHidden(Long movieId, Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = "movie")
    Page<Review> findAllByUserIdAndIsHidden(Long userId, Boolean hidden, Pageable pageable);
    long countByUserIdAndIsHiddenFalse(Long userId);
    long countByIsHiddenTrue();
    Page<Review> findAllByMovieIdAndUserIdAndIsHidden(Long movieId, Long userId, Boolean hidden, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "movie"})
    Optional<Review> findByIdAndUserId(Long id, Long userId);
    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);
}
