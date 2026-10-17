package com.rewind.rewind;

import com.rewind.rewind.list.dto.AddListItemRequest;
import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.dto.UpdateListRequest;
import com.rewind.rewind.list.dto.ReorderListItemsRequest;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.list.service.system.SystemListItemService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.dto.ReviewResponse;
import com.rewind.rewind.review.dto.UpdateReviewRequest;
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

import java.util.UUID;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
    @Autowired RatingRepository ratingRepository;
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
        UpdateListRequest updateList = new UpdateListRequest();
        updateList.setName("Renamed test list");
        updateList.setDescription("A public description");
        updateList.setIsPublic(true);
        assertEquals("Renamed test list", lists.updateMyList(email, listId, updateList).getName());

        Movie secondMovie = new Movie();
        secondMovie.setTitle("Second integration film " + suffix);
        Long secondMovieId = movies.saveAndFlush(secondMovie).getId();
        AddListItemRequest secondItem = new AddListItemRequest();
        secondItem.setMovieId(secondMovieId);
        lists.addItem(email, listId, secondItem);
        var orderedItems = items.findAllByListId(listId);
        Long firstItemId = orderedItems.stream().filter(item -> item.getMovie().getId().equals(movieId)).findFirst().orElseThrow().getId();
        Long secondItemId = orderedItems.stream().filter(item -> item.getMovie().getId().equals(secondMovieId)).findFirst().orElseThrow().getId();
        ReorderListItemsRequest reorder = new ReorderListItemsRequest();
        reorder.setOrderedItemIds(java.util.List.of(secondItemId, firstItemId));
        lists.reorderMyListItems(email, listId, reorder);
        assertEquals(secondMovieId, lists.myListItems(email, listId).get(0).getMovie().getId());

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
        assertEquals(reviewId, reviews.myReview(email, movieId).orElseThrow().getId());
        assertThrows(ResponseStatusException.class, () -> reviews.create(email, movieId, reviewRequest));

        UpdateReviewRequest updateReview = new UpdateReviewRequest();
        updateReview.setContent("Edited review");
        updateReview.setRating(4);
        assertEquals("Edited review", reviews.updateMy(email, reviewId, updateReview).getContent());
        assertEquals(4, ratings.getMyRating(email, movieId).orElseThrow());

        reviews.deleteMy(email, reviewId);
        entityManager.flush();
        assertFalse(reviewRepository.existsByUserIdAndMovieId(userId, movieId));
        assertTrue(reviews.myReview(email, movieId).isEmpty());
        assertEquals(4, ratings.getMyRating(email, movieId).orElseThrow());

        ratings.deleteMyRating(email, movieId);
        entityManager.flush();
        entityManager.clear();
        assertTrue(ratings.getMyRating(email, movieId).isEmpty());
        assertNull(movies.findById(movieId).orElseThrow().getRating());
    }

    @Test
    void concurrentReviewCreatesKeepOneReviewAndReturnConflictForTheLoser() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "race-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("race_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        Movie movie = new Movie();
        movie.setTitle("Concurrent review film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        CreateReviewRequest request = new CreateReviewRequest();
        request.setContent("Concurrent review");
        request.setRating(4);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CompletableFuture<ReviewResponse> first = CompletableFuture.supplyAsync(
                    () -> reviews.create(email, movieId, request), executor);
            CompletableFuture<ReviewResponse> second = CompletableFuture.supplyAsync(
                    () -> reviews.create(email, movieId, request), executor);

            int successes = 0;
            int conflicts = 0;
            for (CompletableFuture<ReviewResponse> future : java.util.List.of(first, second)) {
                try {
                    future.join();
                    successes++;
                } catch (CompletionException ex) {
                    Throwable cause = ex.getCause();
                    if (cause instanceof ResponseStatusException response
                            && response.getStatusCode().value() == 409) {
                        conflicts++;
                    } else {
                        throw ex;
                    }
                }
            }

            assertEquals(1, successes);
            assertEquals(1, conflicts);
            Long userId = userRepository.findByEmail(email).orElseThrow().getId();
            assertEquals(1, reviewRepository.countByUserIdAndMovieId(userId, movieId));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void concurrentRatingUpsertsRemainOneAtomicRating() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "rating-race-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("rating_race_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        Movie movie = new Movie();
        movie.setTitle("Concurrent rating film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        UpsertRatingRequest low = new UpsertRatingRequest();
        low.setRating(2);
        UpsertRatingRequest high = new UpsertRatingRequest();
        high.setRating(5);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CompletableFuture<Void> first = CompletableFuture.runAsync(
                    () -> ratings.upsert(email, movieId, low), executor);
            CompletableFuture<Void> second = CompletableFuture.runAsync(
                    () -> ratings.upsert(email, movieId, high), executor);
            CompletableFuture.allOf(first, second).join();

            Long userId = userRepository.findByEmail(email).orElseThrow().getId();
            assertEquals(1, ratingRepository.countByUserIdAndMovieId(userId, movieId));
            assertTrue(Set.of(2, 5).contains(ratings.getMyRating(email, movieId).orElseThrow()));
        } finally {
            executor.shutdownNow();
        }
    }
}
