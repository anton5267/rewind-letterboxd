package com.rewind.rewind;

import com.rewind.rewind.movie.controller.admin.AdminMovieController;
import com.rewind.rewind.movie.dto.MovieDetailsResponse;
import com.rewind.rewind.movie.service.MovieDetailsService;
import com.rewind.rewind.movie.service.admin.AdminMovieService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminMovieDetailsControllerTests {
    private final MovieDetailsService details = mock(MovieDetailsService.class);
    private final AdminMovieController controller = new AdminMovieController(mock(AdminMovieService.class), details);

    @Test
    void detailsUsesTheAuthenticatedAdminContext() throws Exception {
        var movie = new MovieDetailsResponse(51L, null, "uk", null, "Draft film", null, null,
                null, null, null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), null);
        when(details.getDetails(51L, "admin@example.test")).thenReturn(movie);
        MockMvcBuilders.standaloneSetup(controller).build()
                .perform(get("/api/admin/movies/51").principal(() -> "admin@example.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(51))
                .andExpect(jsonPath("$.title").value("Draft film"));
        verify(details).getDetails(51L, "admin@example.test");
    }

    @Test
    void missingDetailsKeepsTheNotFoundResponse() throws Exception {
        when(details.getDetails(404L, "admin@example.test"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));
        MockMvcBuilders.standaloneSetup(controller).build()
                .perform(get("/api/admin/movies/404").principal(() -> "admin@example.test"))
                .andExpect(status().isNotFound());
    }
}
