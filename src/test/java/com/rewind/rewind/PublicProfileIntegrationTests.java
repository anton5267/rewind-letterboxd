package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.list.service.system.SystemListItemService;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
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
class PublicProfileIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MovieRepository movies;
    @Autowired ReviewService reviews;
    @Autowired MovieListService lists;
    @Autowired SystemListItemService systemLists;
    @Autowired ProfileService profiles;

    @Test
    @Transactional
    void exposesOnlyPublicProfileDataAndVisibleActivity() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "public-profile-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("profile_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        Movie movie = new Movie();
        movie.setTitle("Public profile film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        systemLists.add(email, movieId, ListType.WATCHED);
        CreateReviewRequest review = new CreateReviewRequest();
        review.setContent("Visible profile review");
        review.setRating(5);
        reviews.create(email, movieId, review);

        CreateListRequest publicList = new CreateListRequest();
        publicList.setName("Public profile list");
        publicList.setIsPublic(true);
        lists.create(email, publicList);
        CreateListRequest privateList = new CreateListRequest();
        privateList.setName("Private profile list");
        privateList.setIsPublic(false);
        lists.create(email, privateList);

        var profile = profiles.publicProfile(userId);
        assertEquals("profile_" + suffix, profile.username());
        assertEquals(1, profile.stats().watched());
        assertEquals(1, profile.stats().ratings());
        assertEquals(1, profile.stats().reviews());
        assertEquals(1, profile.lists().size());
        assertEquals("Public profile list", profile.lists().get(0).name());
        assertEquals("Visible profile review", profile.recentReviews().get(0).content());

        var ownProfile = profiles.myProfile(email);
        assertEquals(1, ownProfile.getStats().getWatched());
        assertEquals(1, ownProfile.getStats().getRatings());
        assertEquals(1, ownProfile.getStats().getReviews());
        assertEquals(1, profiles.myRatings(email, 0, 20).getTotalElements());
        assertEquals(movieId, profiles.myRatings(email, 0, 20).getContent().get(0).getMovieId());
        assertEquals(1, profiles.myReviews(email, 0, 20).getTotalElements());
        assertEquals("Visible profile review", profiles.myReviews(email, 0, 20).getContent().get(0).getContent());
        assertEquals(1, profiles.publicSystemCollection(userId, ListType.WATCHED, 0, 20).getTotalElements());
        assertEquals(movieId, profiles.publicSystemCollection(userId, ListType.WATCHED, 0, 20).getContent().get(0).getId());
    }
}
