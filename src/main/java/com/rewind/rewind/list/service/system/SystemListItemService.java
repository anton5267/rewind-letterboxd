package com.rewind.rewind.list.service.system;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemListItemService {

    private final UserRepository users;
    private final MovieRepository movies;
    private final MovieListRepository lists;
    private final ListItemRepository items;
    private final ActivityService activities;

    public SystemListItemService(UserRepository users, MovieRepository movies, MovieListRepository lists, ListItemRepository items, ActivityService activities) {
        this.users = users;
        this.movies = movies;
        this.lists = lists;
        this.items = items;
        this.activities = activities;
    }

    @Transactional
    public void add(String email, Long movieId, ListType type) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByUserAndListType(user, type).orElseThrow();
        var movie = movies.findById(movieId).orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        int inserted = items.insertIgnore(list.getId(), movie.getId(), null);
        if (inserted == 1 && type == ListType.WATCHED) {
            activities.record(user.getId(), ActivityType.WATCHED, movie.getId(), null, null, null);
        }
    }

    @Transactional
    public void remove(String email, Long movieId, ListType type) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByUserAndListType(user, type).orElseThrow();

        items.deleteByListIdAndMovieId(list.getId(), movieId);
    }
}
