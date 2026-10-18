package com.rewind.rewind.comment.service;

import com.rewind.rewind.comment.dto.CommentResponse;
import com.rewind.rewind.comment.dto.CreateCommentRequest;
import com.rewind.rewind.comment.dto.UpdateCommentRequest;
import com.rewind.rewind.comment.entity.ReviewComment;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewCommentService {
    private final ReviewCommentRepository comments;
    private final ReviewRepository reviews;
    private final UserRepository users;

    public ReviewCommentService(ReviewCommentRepository comments, ReviewRepository reviews, UserRepository users) {
        this.comments = comments;
        this.reviews = reviews;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> list(Long reviewId, int page, int size) {
        requireVisibleReview(reviewId);
        return comments.findAllByReviewIdAndUserIsActiveTrueAndIsHiddenFalseOrderByCreatedAtAsc(reviewId,
                        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50))))
                .map(this::toResponse);
    }

    @Transactional
    public CommentResponse create(String email, Long reviewId, CreateCommentRequest request) {
        Review review = requireVisibleReview(reviewId);
        var user = users.findByEmail(email).orElseThrow();
        ReviewComment comment = new ReviewComment();
        comment.setReview(review);
        comment.setUser(user);
        comment.setContent(request.text().trim());
        return toResponse(comments.save(comment));
    }

    @Transactional
    public CommentResponse update(String email, Long commentId, UpdateCommentRequest request) {
        ReviewComment comment = comments.findById(commentId).orElseThrow(this::notFound);
        var user = users.findByEmail(email).orElseThrow();
        if (!comment.getUser().getId().equals(user.getId())) throw forbidden();
        comment.setContent(request.text().trim());
        return toResponse(comments.save(comment));
    }

    @Transactional
    public void delete(String email, Long commentId) {
        ReviewComment comment = comments.findById(commentId).orElseThrow(this::notFound);
        var user = users.findByEmail(email).orElseThrow();
        if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) throw forbidden();
        comments.delete(comment);
    }

    private Review requireVisibleReview(Long reviewId) {
        Review review = reviews.findById(reviewId).orElseThrow(this::notFound);
        if (Boolean.TRUE.equals(review.getIsHidden()) || !Boolean.TRUE.equals(review.getUser().getIsActive())) throw notFound();
        return review;
    }

    private CommentResponse toResponse(ReviewComment comment) {
        return new CommentResponse(comment.getId(), comment.getReview().getId(), comment.getUser().getId(),
                comment.getUser().getUsername(), comment.getUser().getAvatarUrl(), comment.getContent(),
                comment.getCreatedAt(), comment.getUpdatedAt());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment or review not found");
    }

    private ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot change this comment");
    }
}
