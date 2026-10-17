package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.dto.AddListItemRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class HomeFeedIntegrationTests {
    @Autowired UserService users;
    @Autowired MovieRepository movies;
    @Autowired ReviewService reviews;
    @Autowired MovieListService lists;

    @Test
    @Transactional
    void exposesRecentVisibleReviewsAndPublicListsForHomeFeed() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "home-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("home_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        Movie movie = new Movie();
        movie.setTitle("Home feed " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        CreateReviewRequest review = new CreateReviewRequest();
        review.setContent("A visible home review");
        review.setRating(4);
        reviews.create(email, movieId, review);
        assertTrue(reviews.recent(0, 6).getContent().stream()
                .anyMatch(item -> item.movieId().equals(movieId) && item.content().equals("A visible home review")));

        CreateListRequest list = new CreateListRequest();
        list.setName("Home list " + suffix);
        list.setDescription("Visible in public feed");
        list.setIsPublic(true);
        Long listId = lists.create(email, list).getId();
        assertTrue(lists.publicLists(null, 0, 6).getContent().stream()
                .anyMatch(item -> item.getName().equals("Home list " + suffix)));
        AddListItemRequest listItem = new AddListItemRequest();
        listItem.setMovieId(movieId);
        lists.addItem(email, listId, listItem);
        assertEquals(movieId, lists.publicList(listId).movies().get(0).getId());
    }
}
