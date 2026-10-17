package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminModerationQueueService;
import com.rewind.rewind.admin.dto.AdminModerationTarget;
import com.rewind.rewind.comment.entity.ReviewComment;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class AdminModerationQueueIntegrationTests {
    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired MovieRepository movies;
    @Autowired ReviewRepository reviews;
    @Autowired ReviewCommentRepository comments;
    @Autowired AdminModerationQueueService queue;

    @Test
    @Transactional
    void queueCombinesUnmoderatedReviewsAndCommentsInCreatedOrder() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("moderation_" + suffix);
        request.setEmail("moderation_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);

        var user = users.findByEmail(request.getEmail()).orElseThrow();
        var movie = movies.findAll().stream().findFirst().orElseThrow();
        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setContent("queue review");
        review.setRating((byte) 4);
        review = reviews.saveAndFlush(review);

        ReviewComment comment = new ReviewComment();
        comment.setReview(review);
        comment.setUser(user);
        comment.setContent("queue comment");
        comments.saveAndFlush(comment);

        Long reviewId = review.getId();
        var result = queue.list(0, 20).getContent();
        assertTrue(result.stream().anyMatch(item -> item.type().equals("REVIEW") && item.id().equals(reviewId)));
        assertTrue(result.stream().anyMatch(item -> item.type().equals("COMMENT") && item.parentId().equals(reviewId)));
        assertTrue(queue.list("REVIEW", "queue review", 0, 20).getContent().stream()
                .allMatch(item -> item.type().equals("REVIEW") && item.id().equals(reviewId)));
        assertTrue(queue.list("COMMENT", "queue comment", 0, 20).getContent().stream()
                .allMatch(item -> item.type().equals("COMMENT") && item.parentId().equals(reviewId)));
    }

    @Test
    @Transactional
    void hideActionRemovesReviewFromQueueAndRecordsModeration() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("moderation_hide_" + suffix);
        request.setEmail("moderation_hide_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);

        var user = users.findByEmail(request.getEmail()).orElseThrow();
        var movie = movies.findAll().stream().findFirst().orElseThrow();
        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setContent("queue hide review");
        review.setRating((byte) 4);
        review = reviews.saveAndFlush(review);

        queue.hide("REVIEW", review.getId(), request.getEmail(), "policy");

        assertEquals(Boolean.TRUE, reviews.findById(review.getId()).orElseThrow().getIsHidden());
        Long reviewId = review.getId();
        assertTrue(queue.list(0, 50).getContent().stream().noneMatch(item -> item.type().equals("REVIEW") && item.id().equals(reviewId)));
    }

    @Test
    @Transactional
    void bulkHideModerationItemsUsesTheSameServerSideModerationRules() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("moderation_bulk_" + suffix);
        request.setEmail("moderation_bulk_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);

        var user = users.findByEmail(request.getEmail()).orElseThrow();
        var movie = movies.findAll().stream().findFirst().orElseThrow();
        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setContent("bulk moderation review");
        review.setRating((byte) 3);
        Review savedReview = reviews.saveAndFlush(review);
        Long reviewId = savedReview.getId();

        assertEquals(1, queue.hideBulk(List.of(new AdminModerationTarget("REVIEW", reviewId)), request.getEmail(), "bulk policy"));
        assertEquals(Boolean.TRUE, reviews.findById(reviewId).orElseThrow().getIsHidden());
        assertTrue(queue.list("REVIEW", "bulk moderation review", 0, 20).getContent().stream()
                .noneMatch(item -> item.id().equals(reviewId)));
    }
}
