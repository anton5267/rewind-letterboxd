package com.rewind.rewind.social.service;

import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.social.dto.ReviewLikeResponse;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.notification.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewLikeService {
    private final ReviewLikeRepository likes;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final NotificationService notifications;

    public ReviewLikeService(ReviewLikeRepository likes, ReviewRepository reviews, UserRepository users, NotificationService notifications) {
        this.likes = likes;
        this.reviews = reviews;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional
    public void like(String email, Long reviewId) {
        var user = users.findByEmail(email).orElseThrow();
        Review review = visibleReview(reviewId);
        int inserted = likes.insertIgnore(reviewId, user.getId());
        if (inserted == 0) return;
        notifications.reviewLiked(review, user);
    }

    @Transactional
    public void unlike(String email, Long reviewId) {
        var user = users.findByEmail(email).orElseThrow();
        likes.deleteByReviewIdAndUserId(reviewId, user.getId());
    }

    @Transactional(readOnly = true)
    public long count(Long reviewId) {
        visibleReview(reviewId);
        return likes.countActiveByReviewId(reviewId);
    }

    @Transactional(readOnly = true)
    public ReviewLikeResponse status(String email, Long reviewId) {
        var user = users.findByEmail(email).orElseThrow();
        visibleReview(reviewId);
        return new ReviewLikeResponse(likes.existsByReviewIdAndUserId(reviewId, user.getId()), likes.countActiveByReviewId(reviewId));
    }

    private Review visibleReview(Long reviewId) {
        Review review = reviews.findById(reviewId).orElseThrow();
        if (Boolean.TRUE.equals(review.getIsHidden()) || !Boolean.TRUE.equals(review.getUser().getIsActive())) {
            throw new IllegalArgumentException("Review not found");
        }
        return review;
    }
}
