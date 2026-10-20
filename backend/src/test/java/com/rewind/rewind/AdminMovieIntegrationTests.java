package com.rewind.rewind;

import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import com.rewind.rewind.movie.dto.admin.UpdateMovieRequest;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminMovieIntegrationTests {
    @Autowired AdminMovieService movies;

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
}
