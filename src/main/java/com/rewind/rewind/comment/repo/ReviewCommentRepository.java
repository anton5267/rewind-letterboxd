package com.rewind.rewind.comment.repo;

import com.rewind.rewind.comment.entity.ReviewComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    Page<ReviewComment> findAllByReviewIdAndIsHiddenFalseOrderByCreatedAtAsc(Long reviewId, Pageable pageable);
    Page<ReviewComment> findAllByOrderByIdDesc(Pageable pageable);
    Page<ReviewComment> findAllByIsHidden(Boolean hidden, Pageable pageable);
    Page<ReviewComment> findAllByModeratedAtIsNullOrderByCreatedAtAsc(Pageable pageable);
    long countByModeratedAtIsNull();
    @EntityGraph(attributePaths = {"user", "review"})
    @Query("select c from ReviewComment c where c.moderatedAt is null and (:query is null or lower(c.content) like lower(concat('%', :query, '%')) or lower(c.user.username) like lower(concat('%', :query, '%'))) order by c.createdAt asc")
    Page<ReviewComment> findModerationQueue(@Param("query") String query, Pageable pageable);
    @Query("select count(c) from ReviewComment c where c.moderatedAt is null and (:query is null or lower(c.content) like lower(concat('%', :query, '%')) or lower(c.user.username) like lower(concat('%', :query, '%')))")
    long countModerationQueue(@Param("query") String query);
}
