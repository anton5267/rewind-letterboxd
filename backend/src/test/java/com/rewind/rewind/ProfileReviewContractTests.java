package com.rewind.rewind;

import com.rewind.rewind.auth.RefreshSessionService;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.MovieDetailsCacheService;
import com.rewind.rewind.profile.controller.ProfileController;
import com.rewind.rewind.profile.repo.UserSocialLinkRepository;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.rating.entity.Rating;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.LongStream;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Exercises the real mapper and HTTP serialization without starting Spring or a database. */
class ProfileReviewContractTests {
    private static final String EMAIL = "profile-review@example.invalid";
    private static final String POSTER = "https://images.example.invalid/older-review.jpg";
    private static final Instant UPDATED = Instant.parse("2026-10-20T12:00:00Z");
    private final UserRepository users = mock(UserRepository.class);
    private final MovieListRepository lists = mock(MovieListRepository.class);
    private final RatingRepository ratings = mock(RatingRepository.class);
    private final ReviewRepository reviews = mock(ReviewRepository.class);
    private final ProfileService service = new ProfileService(users, mock(MovieRepository.class), mock(MovieDetailsCacheService.class), lists, ratings, reviews,
            mock(ListItemRepository.class), mock(PasswordEncoder.class), mock(RefreshSessionService.class),
            mock(EntityManager.class), mock(ReviewLikeRepository.class), mock(UserSocialLinkRepository.class));
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ProfileController(service)).build();

    @Test
    void profileSummaryIncludesReviewPostersOutsideItsTenRecentRatings() throws Exception {
        User user = user();
        List<Rating> recentRatings = LongStream.rangeClosed(1, 10).mapToObj(id -> {
            Rating rating = mock(Rating.class);
            Movie movie = movie(id, "https://images.example.invalid/recent-" + id + ".jpg");
            when(rating.getMovie()).thenReturn(movie);
            when(rating.getRating()).thenReturn((byte) 4);
            when(rating.getUpdatedAt()).thenReturn(UPDATED);
            return rating;
        }).toList();
        assertTrue(recentRatings.stream().noneMatch(rating -> rating.getMovie().getId() >= 101L));
        when(lists.findAllByUser(user)).thenReturn(List.of());
        when(ratings.findAllByUserIdOrderByUpdatedAtDescIdDesc(42L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(recentRatings));
        List<Review> olderReviews = olderReviews();
        when(reviews.findAllByUserIdOrderByUpdatedAtDescIdDesc(42L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(olderReviews));

        mvc.perform(get("/api/profile/me").principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentRatings.length()").value(10))
                .andExpect(jsonPath("$.recentReviews[0].movieId").value(101))
                .andExpect(jsonPath("$.recentReviews[0].moviePhotoUrl").value(POSTER))
                .andExpect(jsonPath("$.recentReviews[1].moviePhotoUrl").hasJsonPath())
                .andExpect(jsonPath("$.recentReviews[1].moviePhotoUrl").value(nullValue()));
    }

    @Test
    void pagedReviewsExposeTheirOwnPosterAndPreserveMissingImages() throws Exception {
        user();
        PageRequest page = PageRequest.of(1, 12);
        List<Review> olderReviews = olderReviews();
        when(reviews.findAllByUserIdOrderByUpdatedAtDescIdDesc(42L, page))
                .thenReturn(new PageImpl<>(olderReviews, page, 14));

        mvc.perform(get("/api/profile/me/reviews").param("page", "1").param("size", "12")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.totalElements").value(14))
                .andExpect(jsonPath("$.content[0].movieId").value(101))
                .andExpect(jsonPath("$.content[0].moviePhotoUrl").value(POSTER))
                .andExpect(jsonPath("$.content[1].moviePhotoUrl").hasJsonPath())
                .andExpect(jsonPath("$.content[1].moviePhotoUrl").value(nullValue()));

        verify(reviews).findAllByUserIdOrderByUpdatedAtDescIdDesc(eq(42L), eq(page));
        verifyNoInteractions(ratings, lists);
    }

    private User user() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(42L);
        when(user.getUsername()).thenReturn("profile-reader");
        when(user.getEmail()).thenReturn(EMAIL);
        when(user.getRole()).thenReturn(UserRole.USER);
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        return user;
    }

    private List<Review> olderReviews() {
        return List.of(review(1001L, movie(101L, POSTER)), review(1002L, movie(102L, null)));
    }

    private Movie movie(long id, String poster) {
        Movie movie = mock(Movie.class);
        when(movie.getId()).thenReturn(id);
        when(movie.getTitle()).thenReturn("Film " + id);
        when(movie.getPhotoUrl()).thenReturn(poster);
        return movie;
    }

    private Review review(long id, Movie movie) {
        Review review = mock(Review.class);
        when(review.getId()).thenReturn(id);
        when(review.getMovie()).thenReturn(movie);
        when(review.getContent()).thenReturn("An older review " + id);
        when(review.getUpdatedAt()).thenReturn(UPDATED);
        return review;
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken(EMAIL, "unused", List.of());
    }
}
