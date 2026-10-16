package com.rewind.rewind.list.service.system;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.user.entity.User;
import org.springframework.stereotype.Service;

@Service
public class SystemListService {

    private final MovieListRepository lists;

    public SystemListService(MovieListRepository lists) {
        this.lists = lists;
    }

    public void ensureDefaultLists(User user) {
        ensure(user, ListType.WATCHLIST, "Watchlist");
        ensure(user, ListType.WATCHED, "Watched");
        ensure(user, ListType.FAVORITES, "Favorites");
    }

    private void ensure(User user, ListType type, String name) {
        if (lists.findByUserAndListType(user, type).isPresent()) return;

        MovieList list = new MovieList();
        list.setUser(user);
        list.setListType(type);
        list.setName(name);
        list.setDescription(null);
        list.setIsPublic(false);

        lists.save(list);
    }
}
