package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.ReviewLike;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
    long countByReviewId(Long reviewId);
    long deleteByReviewIdAndUserId(Long reviewId, Long userId);

    @Query("select rl.review.user.id as userId, count(rl.id) as likes from ReviewLike rl " +
            "where rl.review.isHidden = false group by rl.review.user.id order by count(rl.id) desc")
    List<PopularReviewerRow> findPopularReviewers(Pageable pageable);

    interface PopularReviewerRow {
        Long getUserId();
        Long getLikes();
    }
}
