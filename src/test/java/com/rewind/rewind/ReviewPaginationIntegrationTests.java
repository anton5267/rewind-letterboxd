package com.rewind.rewind;

import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ReviewPaginationIntegrationTests {
    @Autowired UserService users;
    @Autowired MovieRepository movies;
    @Autowired ReviewRepository reviewRepository;
    @Autowired ReviewService reviews;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void paginatesVisibleReviewsWithoutDuplicatesForEqualTimestamps() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Movie movie = new Movie();
        movie.setTitle("Review pagination " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        for (int index = 0; index < 11; index++) {
            String email = "review-page-" + suffix + "-" + index + "@example.invalid";
            UserRegisterRequest registration = new UserRegisterRequest();
            registration.setUsername("review_page_" + suffix + "_" + index);
            registration.setEmail(email);
            registration.setPassword("test-password-123");
            users.register(registration);
            CreateReviewRequest request = new CreateReviewRequest();
            request.setContent("review-page-marker-" + index);
            request.setRating(4);
            reviews.create(email, movieId, request);
        }
        jdbc.update("UPDATE reviews SET created_at = '2026-01-01 00:00:00' WHERE movie_id = ?", movieId);

        var first = reviews.listByMovie(movieId, 0, 10);
        var second = reviews.listByMovie(movieId, 1, 10);
        var ids = new HashSet<Long>();
        first.getContent().forEach(review -> ids.add(review.getId()));
        second.getContent().forEach(review -> ids.add(review.getId()));

        assertEquals(11, first.getTotalElements());
        assertEquals(10, first.getContent().size());
        assertEquals(1, second.getContent().size());
        assertEquals(11, ids.size());
        assertTrue(first.getContent().get(0).getId() > first.getContent().get(9).getId());
    }
}
