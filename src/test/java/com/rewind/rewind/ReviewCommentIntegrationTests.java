package com.rewind.rewind;

import com.rewind.rewind.comment.dto.CreateCommentRequest;
import com.rewind.rewind.comment.dto.UpdateCommentRequest;
import com.rewind.rewind.comment.service.ReviewCommentService;
import com.rewind.rewind.admin.service.AdminCommentService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ReviewCommentIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MovieRepository movies;
    @Autowired ReviewService reviews;
    @Autowired ReviewCommentService comments;
    @Autowired AdminCommentService adminComments;

    @Test
    @Transactional
    void commentAuthorCanEditAndAdminCanDeleteButAnotherUserCannot() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String authorEmail = register("reviewer_" + suffix, suffix);
        String commenterEmail = register("commenter_" + suffix, suffix);
        String strangerEmail = register("stranger_" + suffix, suffix);

        Movie movie = new Movie();
        movie.setTitle("Comment integration " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        CreateReviewRequest review = new CreateReviewRequest();
        review.setContent("Review that accepts comments");
        review.setRating(4);
        Long reviewId = reviews.create(authorEmail, movieId, review).getId();

        Long commentId = comments.create(commenterEmail, reviewId, new CreateCommentRequest("First comment")).id();
        assertEquals("First comment", comments.list(reviewId, 0, 20).getContent().get(0).text());
        assertEquals("Edited comment", comments.update(commenterEmail, commentId, new UpdateCommentRequest("Edited comment")).text());

        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> comments.delete(strangerEmail, commentId));
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());

        userRepository.findByEmail(strangerEmail).orElseThrow().setRole(UserRole.ADMIN);
        comments.delete(strangerEmail, commentId);
        assertTrue(comments.list(reviewId, 0, 20).isEmpty());
    }

    @Test
    @Transactional
    void adminModerationHidesCommentFromPublicListingAndCanRestoreIt() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = register("comment-admin_" + suffix, suffix);
        String authorEmail = register("comment-author_" + suffix, suffix);
        userRepository.findByEmail(adminEmail).orElseThrow().setRole(UserRole.ADMIN);

        Movie movie = new Movie();
        movie.setTitle("Comment moderation " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        CreateReviewRequest review = new CreateReviewRequest();
        review.setContent("Review for moderation");
        review.setRating(5);
        Long reviewId = reviews.create(authorEmail, movieId, review).getId();
        Long commentId = comments.create(authorEmail, reviewId, new CreateCommentRequest("Needs review")).id();

        adminComments.hide(commentId, adminEmail, "Policy violation");
        assertTrue(comments.list(reviewId, 0, 20).isEmpty());
        adminComments.unhide(commentId, adminEmail);
        assertEquals(1, comments.list(reviewId, 0, 20).getTotalElements());
    }

    private String register(String username, String suffix) {
        String email = username + "@example.invalid";
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
        return email;
    }
}
