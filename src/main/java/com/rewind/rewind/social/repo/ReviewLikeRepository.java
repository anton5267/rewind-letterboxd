package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
    long countByReviewId(Long reviewId);
    long deleteByReviewIdAndUserId(Long reviewId, Long userId);
}
