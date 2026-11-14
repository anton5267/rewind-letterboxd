package com.rewind.rewind.profile.service;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.profile.dto.FavoriteMoveRequest;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;

@Service
public class FavoriteOrderService {
    private final UserRepository users;
    private final MovieListRepository lists;
    private final ListItemRepository items;

    public FavoriteOrderService(UserRepository users, MovieListRepository lists, ListItemRepository items) {
        this.users = users;
        this.lists = lists;
        this.items = items;
    }

    @Transactional
    public void move(String email, FavoriteMoveRequest move) {
        var user = users.findByEmail(email).orElseThrow();
        if (user.getId() != move.expectedUserId()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The current account changed");
        }
        if (move.movieId() == move.targetMovieId()
                || (!"before".equals(move.placement()) && !"after".equals(move.placement()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid favorite move");
        }
        var list = lists.findTypeForUpdate(user, ListType.FAVORITES)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorites not found"));
        var ordered = new ArrayList<>(items.findFavoriteItemsForUpdate(list.getId()));
        var source = ordered.stream().filter(item -> item.getMovie().getId() == move.movieId()).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite film not found"));
        var target = ordered.stream().filter(item -> item.getMovie().getId() == move.targetMovieId()).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite film not found"));
        ordered.remove(source);
        ordered.add(ordered.indexOf(target) + ("after".equals(move.placement()) ? 1 : 0), source);
        for (int index = 0; index < ordered.size(); index++) ordered.get(index).setPosition(index + 1);
        items.saveAll(ordered);
    }
}
