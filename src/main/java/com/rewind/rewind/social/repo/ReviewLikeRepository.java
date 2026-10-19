package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.ReviewLike;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
    long countByReviewIdAndUserId(Long reviewId, Long userId);
    long countByReviewId(Long reviewId);
    long deleteByReviewIdAndUserId(Long reviewId, Long userId);

    @Query("select rl from ReviewLike rl where rl.user.id = :userId and rl.review.isHidden = false "
            + "and rl.review.user.isActive = true order by rl.createdAt desc, rl.id desc")
    @EntityGraph(attributePaths = {"review", "review.movie"})
    Page<ReviewLike> findVisibleReviewLikesByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("select count(rl.id) from ReviewLike rl where rl.review.id = :reviewId and rl.user.isActive = true")
    long countActiveByReviewId(@Param("reviewId") Long reviewId);

    @EntityGraph(attributePaths = "user")
    @Query("select rl from ReviewLike rl where rl.review.id = :reviewId and rl.user.isActive = true "
            + "order by rl.createdAt desc, rl.id desc")
    List<ReviewLike> findActiveByReviewId(@Param("reviewId") Long reviewId, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO review_likes (review_id, user_id, created_at) "
            + "VALUES (:reviewId, :userId, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertIgnore(@Param("reviewId") Long reviewId,
                     @Param("userId") Long userId);

    @Query("select rl.review.user.id as userId, count(rl.id) as likes from ReviewLike rl " +
            "where rl.review.isHidden = false and rl.review.user.isActive = true and rl.user.isActive = true "
                    + "group by rl.review.user.id " +
            "order by count(rl.id) desc, rl.review.user.id desc")
    List<PopularReviewerRow> findPopularReviewers(Pageable pageable);

    interface PopularReviewerRow {
        Long getUserId();
        Long getLikes();
    }
}
