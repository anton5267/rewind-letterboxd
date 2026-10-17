package com.rewind.rewind;

import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AdminMovieIntegrationTests {
    @Autowired AdminMovieService movies;

    @Test
    @Transactional
    void adminMovieListingIsPagedAndUsesMovieCards() {
        CreateMovieRequest request = new CreateMovieRequest();
        request.setTitle("Admin movie listing");
        movies.create(request);
        assertTrue(movies.list(0, 10).getContent().stream().anyMatch(movie -> movie.getTitle().equals("Admin movie listing")));
    }
}
