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
import org.springframework.jdbc.core.JdbcTemplate;
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
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void paginationIncludesEveryItemBeyond250AndKeepsTimestampTiesStable() {
        String marker = "paging_" + UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(marker);
        request.setEmail(marker + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);
        var user = users.findByEmail(request.getEmail()).orElseThrow();
        Review review = new Review();
        review.setUser(user);
        review.setMovie(movies.findAll().stream().findFirst().orElseThrow());
        review.setContent(marker);
        review.setRating((byte) 4);
        Long reviewId = reviews.saveAndFlush(review).getId();
        jdbc.update("UPDATE reviews SET created_at = '2026-01-01 00:00:00' WHERE id = ?", reviewId);
        for (int i = 0; i < 260; i++) {
            jdbc.update("INSERT INTO comments (review_id, user_id, content, created_at) VALUES (?, ?, ?, '2026-01-01 00:00:00')",
                    reviewId, user.getId(), marker + " comment " + i);
        }
        var expectedIds = jdbc.queryForList("SELECT id FROM comments WHERE review_id = ? ORDER BY id", Long.class, reviewId);
        var actualIds = new java.util.ArrayList<Long>();
        for (int page = 0; page < 6; page++) {
            var result = queue.list("COMMENT", marker, page, 50);
            assertEquals(260, result.getTotalElements());
            actualIds.addAll(result.getContent().stream().map(item -> item.id()).toList());
        }
        assertEquals(expectedIds, actualIds, "Pagination must neither omit nor repeat tied records");
        var combinedLastPage = queue.list(null, marker, 5, 50);
        assertEquals(261, combinedLastPage.getTotalElements());
        assertEquals(11, combinedLastPage.getNumberOfElements());
        assertEquals("REVIEW", combinedLastPage.getContent().get(10).type());
        assertEquals(reviewId, combinedLastPage.getContent().get(10).id());
        assertEquals(0, queue.list(null, marker, Integer.MAX_VALUE, 50).getNumberOfElements());
        assertEquals(1, queue.list("REVIEW", marker, 0, 50).getTotalElements());
        assertEquals(0, queue.list(null, "absent_" + marker, 0, 50).getTotalElements());
    }

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
        String marker = "queue_" + suffix;
        review.setContent("queue review " + marker);
        review.setRating((byte) 4);
        review = reviews.saveAndFlush(review);

        ReviewComment comment = new ReviewComment();
        comment.setReview(review);
        comment.setUser(user);
        comment.setContent("queue comment " + marker);
        comments.saveAndFlush(comment);

        Long reviewId = review.getId();
        // Scope the combined queue to this test's records so the assertion
        // remains valid when a developer has run other smoke tests locally.
        var result = queue.list(null, marker, 0, 20).getContent();
        assertTrue(result.stream().anyMatch(item -> item.type().equals("REVIEW") && item.id().equals(reviewId)));
        assertTrue(result.stream().anyMatch(item -> item.type().equals("COMMENT") && item.parentId().equals(reviewId)));
        assertTrue(queue.list("REVIEW", marker, 0, 20).getContent().stream()
                .allMatch(item -> item.type().equals("REVIEW") && item.id().equals(reviewId)));
        assertTrue(queue.list("COMMENT", marker, 0, 20).getContent().stream()
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
    void hideActionRemovesCommentFromQueueAndRecordsModeration() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("moderation_comment_" + suffix);
        request.setEmail("moderation_comment_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);

        var user = users.findByEmail(request.getEmail()).orElseThrow();
        var movie = movies.findAll().stream().findFirst().orElseThrow();
        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setContent("comment parent review " + suffix);
        review.setRating((byte) 4);
        review = reviews.saveAndFlush(review);

        ReviewComment comment = new ReviewComment();
        comment.setReview(review);
        comment.setUser(user);
        comment.setContent("queue hide comment " + suffix);
        comment = comments.saveAndFlush(comment);
        Long commentId = comment.getId();

        queue.hide("COMMENT", commentId, request.getEmail(), "comment policy");

        ReviewComment hidden = comments.findById(commentId).orElseThrow();
        assertEquals(Boolean.TRUE, hidden.getIsHidden());
        assertEquals("comment policy", hidden.getModeratedReason());
        assertTrue(queue.list("COMMENT", "queue hide comment", 0, 50).getContent().stream()
                .noneMatch(item -> item.id().equals(commentId)));
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
