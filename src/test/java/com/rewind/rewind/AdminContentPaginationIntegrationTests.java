package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminCommentService;
import com.rewind.rewind.admin.service.AdminReviewService;
import com.rewind.rewind.comment.entity.ReviewComment;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.movie.entity.Movie;
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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AdminContentPaginationIntegrationTests {
    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired MovieRepository movies;
    @Autowired ReviewRepository reviews;
    @Autowired ReviewCommentRepository comments;
    @Autowired AdminReviewService adminReviews;
    @Autowired AdminCommentService adminComments;

    @Test
    @Transactional
    void reviewsAndCommentsRemainReachableAcrossAdminPagesAndVisibilityFilters() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("admin_pages_" + suffix);
        request.setEmail("admin_pages_" + suffix + "@example.invalid");
        request.setPassword("test-password-123");
        userService.register(request);
        var author = users.findByEmail(request.getEmail()).orElseThrow();

        List<Movie> createdMovies = new ArrayList<>();
        for (int index = 0; index < 51; index++) {
            Movie movie = new Movie();
            movie.setTitle("Admin paging " + suffix + " " + index);
            createdMovies.add(movie);
        }
        createdMovies = movies.saveAllAndFlush(createdMovies);

        List<Review> createdReviews = new ArrayList<>();
        for (int index = 0; index < createdMovies.size(); index++) {
            Review review = new Review();
            review.setUser(author);
            review.setMovie(createdMovies.get(index));
            review.setContent("Admin review paging " + suffix + " " + index);
            review.setRating((byte) 4);
            createdReviews.add(review);
        }
        createdReviews = reviews.saveAllAndFlush(createdReviews);

        List<ReviewComment> createdComments = new ArrayList<>();
        for (int index = 0; index < createdReviews.size(); index++) {
            ReviewComment comment = new ReviewComment();
            comment.setReview(createdReviews.get(index));
            comment.setUser(author);
            comment.setContent("Admin comment paging " + suffix + " " + index);
            comment.setIsHidden(true);
            createdComments.add(comment);
        }
        createdComments = comments.saveAllAndFlush(createdComments);

        var firstReviewPage = adminReviews.list(null, author.getId(), false, 0, 50);
        var secondReviewPage = adminReviews.list(null, author.getId(), false, 1, 50);
        assertEquals(51, firstReviewPage.getTotalElements());
        assertEquals(50, firstReviewPage.getNumberOfElements());
        assertEquals(1, secondReviewPage.getNumberOfElements());
        var reviewIds = new HashSet<Long>();
        firstReviewPage.forEach(item -> reviewIds.add(item.getId()));
        secondReviewPage.forEach(item -> reviewIds.add(item.getId()));
        assertEquals(51, reviewIds.size(), "Review pages must neither omit nor repeat records");

        var expectedCommentIds = createdComments.stream().map(comment -> comment.getId()).collect(java.util.stream.Collectors.toSet());
        var actualCommentIds = new HashSet<Long>();
        var firstCommentPage = adminComments.list(true, 0, 50);
        for (int page = 0; page < firstCommentPage.getTotalPages(); page++) {
            adminComments.list(true, page, 50).forEach(item -> {
                if (expectedCommentIds.contains(item.id())) actualCommentIds.add(item.id());
                assertTrue(item.isHidden());
            });
        }
        assertEquals(expectedCommentIds, actualCommentIds, "Hidden comment pages must expose every matching record exactly once");
    }
}
