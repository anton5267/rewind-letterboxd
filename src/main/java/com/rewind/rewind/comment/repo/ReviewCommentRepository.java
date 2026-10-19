package com.rewind.rewind.comment.repo;

import com.rewind.rewind.comment.entity.ReviewComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    Page<ReviewComment> findAllByReviewIdAndUserIsActiveTrueAndIsHiddenFalseOrderByCreatedAtAscIdAsc(Long reviewId, Pageable pageable);
    @EntityGraph(attributePaths = {"review", "user"})
    Page<ReviewComment> findAllByOrderByIdDesc(Pageable pageable);
    @EntityGraph(attributePaths = {"review", "user"})
    Page<ReviewComment> findAllByIsHidden(Boolean hidden, Pageable pageable);
}
