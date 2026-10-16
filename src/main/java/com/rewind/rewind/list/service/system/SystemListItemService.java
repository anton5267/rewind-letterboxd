package com.rewind.rewind.list.service.system;

import com.rewind.rewind.list.entity.ListItem;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemListItemService {

    private final UserRepository users;
    private final MovieRepository movies;
    private final MovieListRepository lists;
    private final ListItemRepository items;

    public SystemListItemService(UserRepository users, MovieRepository movies, MovieListRepository lists, ListItemRepository items) {
        this.users = users;
        this.movies = movies;
        this.lists = lists;
        this.items = items;
    }

    public void add(String email, Long movieId, ListType type) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByUserAndListType(user, type).orElseThrow();
        var movie = movies.findById(movieId).orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        if (items.existsByListAndMovieId(list, movieId)) return;

        ListItem item = new ListItem();
        item.setList(list);
        item.setMovie(movie);
        item.setPosition(null);
        items.save(item);
    }

    @Transactional
    public void remove(String email, Long movieId, ListType type) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByUserAndListType(user, type).orElseThrow();

        items.deleteByListIdAndMovieId(list.getId(), movieId);
    }
}
