package com.rewind.rewind;

import com.rewind.rewind.list.entity.ListItem;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class PublicListPreviewIntegrationTests {
    @Autowired UserService users;
    @Autowired MovieRepository movies;
    @Autowired MovieListRepository movieLists;
    @Autowired ListItemRepository listItems;
    @Autowired MovieListService lists;

    @Test
    @Transactional
    void publicListFeedIncludesFiveExistingMoviesInPreviewOrder() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "preview-owner-" + suffix + "@example.invalid";
        UserRegisterRequest register = new UserRegisterRequest();
        register.setUsername("preview_owner_" + suffix);
        register.setEmail(email);
        register.setPassword("test-password-123");
        users.register(register);

        CreateListRequest request = new CreateListRequest();
        request.setName("Five-poster preview " + suffix);
        request.setIsPublic(true);
        var created = lists.create(email, request);
        var list = movieLists.findById(created.getId()).orElseThrow();
        for (int position = 0; position < 5; position++) {
            Movie movie = new Movie();
            movie.setTitle("Preview film " + position + " " + suffix);
            movie.setPhotoUrl("https://example.invalid/preview-" + position + ".jpg");
            movie = movies.save(movie);
            ListItem item = new ListItem();
            item.setList(list);
            item.setMovie(movie);
            item.setPosition(position);
            listItems.save(item);
        }

        var card = lists.popularPublicLists(0, 100).getContent().stream()
                .filter(item -> item.getId().equals(created.getId()))
                .findFirst().orElseThrow();
        assertEquals(5, card.getPreviewMovies().size());
        assertEquals("Preview film 0 " + suffix, card.getPreviewMovies().get(0).getTitle());
        assertEquals("Preview film 4 " + suffix, card.getPreviewMovies().get(4).getTitle());
    }
}
