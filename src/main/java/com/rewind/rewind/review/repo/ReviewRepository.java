package com.rewind.rewind.review.repo;

import com.rewind.rewind.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findAllByMovieId(Long movieId, Pageable pageable);
    Page<Review> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    Page<Review> findAllByMovieIdAndIsHiddenFalse(Long movieId, Pageable pageable);

    Page<Review> findAllByIsHidden(Boolean hidden, Pageable pageable);
    Page<Review> findAllByMovieIdAndIsHidden(Long movieId, Boolean hidden, Pageable pageable);
    Page<Review> findAllByUserIdAndIsHidden(Long userId, Boolean hidden, Pageable pageable);
    Page<Review> findAllByMovieIdAndUserIdAndIsHidden(Long movieId, Long userId, Boolean hidden, Pageable pageable);
    Optional<Review> findByIdAndUserId(Long id, Long userId);
    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);
}
