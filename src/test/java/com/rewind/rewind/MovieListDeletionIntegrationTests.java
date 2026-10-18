package com.rewind.rewind;

import com.rewind.rewind.list.dto.AddListItemRequest;
import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class MovieListDeletionIntegrationTests {

    @Autowired UserService users;
    @Autowired MovieListService lists;
    @Autowired MovieListRepository listRepository;
    @Autowired ListItemRepository items;
    @Autowired MovieRepository movies;
    @Autowired EntityManager entityManager;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void ownerCanDeleteCustomListAndDependentDataButNotSystemOrForeignLists() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String ownerEmail = "list-owner-" + suffix + "@example.invalid";
        String strangerEmail = "list-stranger-" + suffix + "@example.invalid";
        register("list_owner_" + suffix, ownerEmail);
        register("list_stranger_" + suffix, strangerEmail);

        Movie movie = new Movie();
        movie.setTitle("List deletion film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        CreateListRequest request = new CreateListRequest();
        request.setName("Disposable list " + suffix);
        request.setDescription("Owner deletion integration fixture");
        request.setIsPublic(true);
        request.setTags(List.of("delete-fixture", "integration"));
        Long listId = lists.create(ownerEmail, request).getId();

        AddListItemRequest item = new AddListItemRequest();
        item.setMovieId(movieId);
        lists.addItem(ownerEmail, listId, item);
        entityManager.flush();

        assertTrue(items.existsByListIdAndMovieId(listId, movieId));
        assertEquals(2, count("list_tags", listId));
        assertEquals(1, count("user_activities", listId));
        assertThrows(IllegalArgumentException.class, () -> lists.deleteMyList(strangerEmail, listId));
        assertTrue(listRepository.existsById(listId));

        Long systemListId = lists.myLists(ownerEmail).stream()
                .filter(candidate -> candidate.getListType() == ListType.WATCHLIST)
                .findFirst()
                .orElseThrow()
                .getId();
        assertThrows(IllegalArgumentException.class, () -> lists.deleteMyList(ownerEmail, systemListId));
        assertTrue(listRepository.existsById(systemListId));

        lists.deleteMyList(ownerEmail, listId);
        entityManager.flush();
        entityManager.clear();

        assertFalse(listRepository.existsById(listId));
        assertEquals(0, items.countByListId(listId));
        assertEquals(0, count("list_tags", listId));
        assertEquals(0, count("user_activities", listId));
    }

    private int count(String table, Long listId) {
        Integer value = jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE list_id = ?", Integer.class, listId);
        return value == null ? 0 : value;
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
    }
}
