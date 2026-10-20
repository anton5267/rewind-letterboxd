package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import com.rewind.rewind.social.service.FollowService;
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
class ActivityIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired FollowService follows;
    @Autowired ActivityService activities;
    @Autowired RatingService ratings;
    @Autowired MovieListService lists;
    @Autowired MovieRepository movies;

    @Test
    @Transactional
    void recordsPublicProfileAndFollowingActivity() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String viewerEmail = register("viewer_" + suffix, "viewer-" + suffix + "@example.invalid");
        String authorEmail = register("author_" + suffix, "activity-author-" + suffix + "@example.invalid");
        Long viewerId = userRepository.findByEmail(viewerEmail).orElseThrow().getId();
        Long authorId = userRepository.findByEmail(authorEmail).orElseThrow().getId();
        Movie movie = new Movie();
        movie.setTitle("Activity film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        follows.follow(viewerEmail, authorId);
        UpsertRatingRequest rating = new UpsertRatingRequest();
        rating.setRating(4);
        ratings.upsert(authorEmail, movieId, rating);
        CreateListRequest list = new CreateListRequest();
        list.setName("Public activity list");
        list.setIsPublic(true);
        lists.create(authorEmail, list);

        var own = activities.profile(viewerId, 0, 20).getContent();
        assertTrue(own.stream().anyMatch(activity -> activity.type() == ActivityType.FOLLOW && activity.relatedUser().id().equals(authorId)));
        var following = activities.following(viewerEmail, 0, 20).getContent();
        assertTrue(following.stream().anyMatch(activity -> activity.type() == ActivityType.RATING && activity.movie().id().equals(movieId)));
        assertTrue(following.stream().anyMatch(activity -> activity.type() == ActivityType.LIST && activity.list() != null));
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
