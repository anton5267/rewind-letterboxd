package com.rewind.rewind;

import com.rewind.rewind.profile.dto.DeleteAccountRequest;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AccountDeletionIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired ProfileService profile;
    @Autowired MovieRepository movies;
    @Autowired RatingService ratings;
    @Autowired EntityManager entityManager;

    @Test
    @Transactional
    void deletingRatedAccountsRecalculatesRemainingAverageAndLastRating() {
        String suffix = Long.toString(System.nanoTime());
        String firstEmail = registerRatedAccount("first" + suffix);
        String secondEmail = registerRatedAccount("second" + suffix);
        Movie movie = new Movie();
        movie.setTitle("Account deletion rating " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        UpsertRatingRequest request = new UpsertRatingRequest();
        request.setRating(2);
        ratings.upsert(firstEmail, movieId, request);
        request.setRating(4);
        ratings.upsert(secondEmail, movieId, request);
        entityManager.clear();
        assertEquals(0, new BigDecimal("3.0").compareTo(movies.findById(movieId).orElseThrow().getRating()));

        DeleteAccountRequest deletion = new DeleteAccountRequest();
        deletion.setCurrentPassword("test-password-123");
        profile.deleteMyAccount(firstEmail, deletion);
        entityManager.clear();
        assertEquals(0, new BigDecimal("4.0").compareTo(movies.findById(movieId).orElseThrow().getRating()));
        assertEquals(4, ratings.getMyRating(secondEmail, movieId).orElseThrow());

        profile.deleteMyAccount(secondEmail, deletion);
        entityManager.clear();
        assertNull(movies.findById(movieId).orElseThrow().getRating());
    }

    private String registerRatedAccount(String suffix) {
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("delete_" + suffix);
        registration.setEmail("delete-" + suffix + "@example.invalid");
        registration.setPassword("test-password-123");
        users.register(registration);
        return registration.getEmail();
    }

    @Test
    @Transactional
    void accountDeletionRequiresPasswordAndRemovesUserData() {
        String email = "delete-account-" + System.nanoTime() + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("delete-account-user-" + System.nanoTime());
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        DeleteAccountRequest wrong = new DeleteAccountRequest();
        wrong.setCurrentPassword("wrong-password");
        assertThrows(IllegalArgumentException.class, () -> profile.deleteMyAccount(email, wrong));
        assertTrue(userRepository.findByEmail(email).isPresent());

        DeleteAccountRequest correct = new DeleteAccountRequest();
        correct.setCurrentPassword("test-password-123");
        profile.deleteMyAccount(email, correct);
        assertTrue(userRepository.findByEmail(email).isEmpty());
    }
}
