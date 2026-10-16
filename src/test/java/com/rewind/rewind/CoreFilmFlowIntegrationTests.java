package com.rewind.rewind;

import com.rewind.rewind.list.dto.AddListItemRequest;
import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.list.service.system.SystemListItemService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CoreFilmFlowIntegrationTests {

    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MovieRepository movies;
    @Autowired MovieListService lists;
    @Autowired ListItemRepository items;
    @Autowired SystemListItemService systemLists;
    @Autowired RatingService ratings;
    @Autowired ReviewService reviews;
    @Autowired ReviewRepository reviewRepository;
    @Autowired EntityManager entityManager;

    @Test
    @Transactional
    void userCanRemoveListItemsAndKeepRatingWhenDeletingReview() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "flow-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("flow_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        Movie movie = new Movie();
        movie.setTitle("Integration film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        CreateListRequest listRequest = new CreateListRequest();
        listRequest.setName("Test list");
        Long listId = lists.create(email, listRequest).getId();
        AddListItemRequest itemRequest = new AddListItemRequest();
        itemRequest.setMovieId(movieId);
        lists.addItem(email, listId, itemRequest);
        assertTrue(items.existsByListIdAndMovieId(listId, movieId));
        lists.removeItem(email, listId, movieId);
        entityManager.flush();
        assertFalse(items.existsByListIdAndMovieId(listId, movieId));

        systemLists.add(email, movieId, ListType.WATCHLIST);
        Long watchlistId = lists.myLists(email).stream()
                .filter(list -> list.getListType() == ListType.WATCHLIST)
                .findFirst().orElseThrow().getId();
        systemLists.remove(email, movieId, ListType.WATCHLIST);
        entityManager.flush();
        assertFalse(items.existsByListIdAndMovieId(watchlistId, movieId));

        UpsertRatingRequest ratingRequest = new UpsertRatingRequest();
        ratingRequest.setRating(4);
        ratings.upsert(email, movieId, ratingRequest);
        assertEquals(4, ratings.getMyRating(email, movieId).orElseThrow());

        CreateReviewRequest reviewRequest = new CreateReviewRequest();
        reviewRequest.setContent("A useful review");
        reviewRequest.setRating(5);
        Long reviewId = reviews.create(email, movieId, reviewRequest).getId();
        assertEquals(5, ratings.getMyRating(email, movieId).orElseThrow());
        assertThrows(ResponseStatusException.class, () -> reviews.create(email, movieId, reviewRequest));

        reviews.deleteMy(email, reviewId);
        entityManager.flush();
        assertFalse(reviewRepository.existsByUserIdAndMovieId(userId, movieId));
        assertEquals(5, ratings.getMyRating(email, movieId).orElseThrow());

        ratings.deleteMyRating(email, movieId);
        entityManager.flush();
        entityManager.clear();
        assertTrue(ratings.getMyRating(email, movieId).isEmpty());
        assertNull(movies.findById(movieId).orElseThrow().getRating());
    }
}
