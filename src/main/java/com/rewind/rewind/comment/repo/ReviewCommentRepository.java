package com.rewind.rewind.comment.repo;

import com.rewind.rewind.comment.entity.ReviewComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    Page<ReviewComment> findAllByReviewIdAndIsHiddenFalseOrderByCreatedAtAsc(Long reviewId, Pageable pageable);
    Page<ReviewComment> findAllByOrderByIdDesc(Pageable pageable);
    Page<ReviewComment> findAllByIsHidden(Boolean hidden, Pageable pageable);
}
