package com.rewind.rewind;

import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import com.rewind.rewind.movie.dto.admin.UpdateMovieRequest;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminMovieIntegrationTests {
    @Autowired AdminMovieService movies;
    @Autowired MovieRepository movieRepository;
    @Autowired ReviewRepository reviews;
    @Autowired UserRepository users;

    @Test
    @Transactional
    void adminMovieListingIsPagedAndUsesMovieCards() {
        CreateMovieRequest request = new CreateMovieRequest();
        request.setTitle("Admin movie listing");
        movies.create(request);
        Long id = movies.list(0, 10).getContent().stream().filter(movie -> movie.getTitle().equals("Admin movie listing")).findFirst().orElseThrow().getId();
        UpdateMovieRequest update = new UpdateMovieRequest();
        update.setTitle("Admin movie edited");
        assertEquals("Admin movie edited", movies.update(id, update).getTitle());
        movies.delete(id);
        assertFalse(movies.list(0, 10).getContent().stream().anyMatch(movie -> movie.getId().equals(id)));
    }

    @Test
    @Transactional
    void adminCatalogSearchReturnsOnlyVisibleReviewsByActiveAuthors() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        CreateMovieRequest request = new CreateMovieRequest();
        request.setTitle("Admin aggregate " + unique);
        request.setDurationMinutes(97);
        request.setAgeRating("PG-13");
        Long movieId = movies.create(request).getId();
        var movie = movieRepository.findById(movieId).orElseThrow();

        saveReview(movie, "visible", true, false, unique);
        saveReview(movie, "hidden", true, true, unique);
        saveReview(movie, "inactive", false, false, unique);

        var page = movies.listCatalog(0, 6, unique);
        assertEquals(1, page.getTotalElements());
        var row = page.getContent().get(0);
        assertEquals(movieId, row.id());
        assertEquals(97, row.durationMinutes());
        assertEquals("PG-13", row.ageRating());
        assertEquals(1L, row.reviewCount());
    }

    private void saveReview(com.rewind.rewind.movie.entity.Movie movie, String label, boolean active,
                            boolean hidden, String unique) {
        User user = new User();
        user.setUsername("adminagg_" + unique + "_" + label);
        user.setEmail("adminagg_" + unique + "_" + label + "@example.test");
        user.setPasswordHash("integration-test-hash");
        user.setRole(UserRole.USER);
        user.setIsActive(active);
        user = users.save(user);

        Review review = new Review();
        review.setMovie(movie);
        review.setUser(user);
        review.setContent("Aggregate fixture " + label);
        review.setIsHidden(hidden);
        reviews.save(review);
    }
}
