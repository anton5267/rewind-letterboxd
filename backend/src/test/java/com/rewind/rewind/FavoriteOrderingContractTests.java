package com.rewind.rewind;

import com.rewind.rewind.list.entity.ListItem;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.profile.dto.FavoriteMoveRequest;
import com.rewind.rewind.profile.service.FavoriteOrderService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FavoriteOrderingContractTests {
    private final MovieListRepository lists = mock(MovieListRepository.class);
    private final ListItemRepository items = mock(ListItemRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final FavoriteOrderService service = new FavoriteOrderService(users, lists, items);
    private final User user = new User();

    private MovieList list() {
        ReflectionTestUtils.setField(user, "id", 7L);
        var list = new MovieList();
        ReflectionTestUtils.setField(list, "id", 4L);
        list.setListType(ListType.FAVORITES);
        list.setUser(user);
        when(users.findByEmail("fixture@example.invalid")).thenReturn(Optional.of(user));
        when(lists.findTypeForUpdate(user, ListType.FAVORITES)).thenReturn(Optional.of(list));
        when(lists.findByIdAndUser(4L, user)).thenReturn(Optional.of(list));
        return list;
    }

    private ListItem item(long id, Integer position, String date) {
        var item = new ListItem();
        ReflectionTestUtils.setField(item, "id", id);
        ReflectionTestUtils.setField(item, "addedAt", Instant.parse(date));
        item.setPosition(position);
        var movie = new Movie();
        ReflectionTestUtils.setField(movie, "id", id);
        movie.setTitle("Film " + id);
        item.setMovie(movie);
        return item;
    }

    @Test
    void atomicMovesAreIdempotentAndPreserveEveryOtherItem() {
        list();
        var first = item(17, null, "2026-01-03T00:00:00Z");
        var second = item(18, null, "2026-01-02T00:00:00Z");
        var other = item(19, null, "2026-01-01T00:00:00Z");
        var current = new ArrayList<>(List.of(first, second, other));
        when(items.findFavoriteItemsForUpdate(4L)).thenAnswer(call -> current);
        when(items.saveAll(any())).thenAnswer(call -> {
            current.clear();
            for (ListItem value : (Iterable<ListItem>) call.getArgument(0)) current.add(value);
            return current;
        });
        var move = new FavoriteMoveRequest(17, 18, "after", 7);
        service.move("fixture@example.invalid", move);
        service.move("fixture@example.invalid", move);
        assertEquals(List.of(18L, 17L, 19L), current.stream().map(ListItem::getId).toList());
        assertEquals(List.of(1, 2, 3), current.stream().map(ListItem::getPosition).toList());
        service.move("fixture@example.invalid", new FavoriteMoveRequest(19, 18, "before", 7));
        assertEquals(List.of(19L, 18L, 17L), current.stream().map(ListItem::getId).toList());
    }

    @Test
    void expectedViewerMismatchRejectsBeforeAnyListAccess() {
        list();
        var error = assertThrows(ResponseStatusException.class,
                () -> service.move("fixture@example.invalid", new FavoriteMoveRequest(17, 18, "after", 6)));
        assertEquals(409, error.getStatusCode().value());
        verify(lists, never()).findTypeForUpdate(any(), any());
        verifyNoInteractions(items);
    }

    @Test
    void missingFavoriteOrInvalidMoveDoesNotWrite() {
        list();
        when(items.findFavoriteItemsForUpdate(4L)).thenReturn(List.of(item(17, null, "2026-01-01T00:00:00Z")));
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.move("fixture@example.invalid", new FavoriteMoveRequest(17, 99, "after", 7))).getStatusCode().value());
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.move("fixture@example.invalid", new FavoriteMoveRequest(17, 17, "after", 7))).getStatusCode().value());
        verify(items, never()).saveAll(any());
    }

    @Test
    void favoriteItemReadsPreferSavedPositionsThenLegacyLatestFirstOrder() {
        list();
        var legacyOlder = item(17, null, "2026-01-01T00:00:00Z");
        var legacyNewer = item(18, null, "2026-01-02T00:00:00Z");
        var ranked = item(19, 1, "2025-01-01T00:00:00Z");
        when(items.findAllByListId(4L)).thenReturn(List.of(legacyOlder, legacyNewer, ranked));
        var listService = new MovieListService(lists, items, users, null, null, null, null);
        assertEquals(List.of(19L, 18L, 17L),
                listService.myListItems("fixture@example.invalid", 4L).stream().map(value -> value.getId()).toList());
    }
}
