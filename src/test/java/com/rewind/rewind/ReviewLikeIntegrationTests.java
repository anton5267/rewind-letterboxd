package com.rewind.rewind;

import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.social.service.ReviewLikeService;
import com.rewind.rewind.social.service.PopularReviewerService;
import com.rewind.rewind.notification.service.NotificationService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ReviewLikeIntegrationTests {
    @Autowired UserService users;
    @Autowired MovieRepository movies;
    @Autowired ReviewService reviews;
    @Autowired ReviewLikeService likes;
    @Autowired PopularReviewerService popularReviewers;
    @Autowired NotificationService notifications;
    @Autowired UserRepository userRepository;

    @Test
    @Transactional
    void likesAreUniqueAndRemovableByTheLikingUser() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String author = register("author_" + suffix, "author-" + suffix + "@example.invalid");
        String liker = register("liker_" + suffix, "liker-" + suffix + "@example.invalid");
        Long authorId = userRepository.findByEmail(author).orElseThrow().getId();
        Movie movie = new Movie();
        movie.setTitle("Liked review film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        CreateReviewRequest request = new CreateReviewRequest();
        request.setContent("A review to like");
        request.setRating(4);
        Long reviewId = reviews.create(author, movieId, request).getId();

        likes.like(liker, reviewId);
        likes.like(liker, reviewId);
        assertTrue(notifications.mine("author-" + suffix + "@example.invalid", 0, 20).getContent().stream()
                .anyMatch(notification -> notification.type().name().equals("REVIEW_LIKED") && reviewId.equals(notification.reviewId())));
        assertEquals(1, likes.count(reviewId));
        assertTrue(likes.status(liker, reviewId).liked());
        assertTrue(popularReviewers.popular(10).stream()
                .anyMatch(reviewer -> reviewer.id().equals(authorId) && reviewer.likes() == 1));
        likes.unlike(liker, reviewId);
        assertEquals(0, likes.count(reviewId));
        assertFalse(likes.status(liker, reviewId).liked());
    }

    private String register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
        return email;
    }
}
