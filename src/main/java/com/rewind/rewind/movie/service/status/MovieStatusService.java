package com.rewind.rewind.movie.service.status;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieStatusResponse;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class MovieStatusService {

    private final UserRepository users;
    private final MovieListRepository lists;
    private final ListItemRepository items;
    private final RatingRepository ratings;

    public MovieStatusService(UserRepository users, MovieListRepository lists, ListItemRepository items, RatingRepository ratings) {
        this.users = users;
        this.lists = lists;
        this.items = items;
        this.ratings = ratings;
    }

    public MovieStatusResponse myStatus(String email, Long movieId) {
        var user = users.findByEmail(email).orElseThrow();

        var watchlist = lists.findByUserAndListType(user, ListType.WATCHLIST).orElseThrow();
        var watched = lists.findByUserAndListType(user, ListType.WATCHED).orElseThrow();
        var favorites = lists.findByUserAndListType(user, ListType.FAVORITES).orElseThrow();

        boolean inWatchlist = items.existsByListIdAndMovieId(watchlist.getId(), movieId);
        boolean isWatched = items.existsByListIdAndMovieId(watched.getId(), movieId);
        boolean isFavorite = items.existsByListIdAndMovieId(favorites.getId(), movieId);

        Integer myRating = ratings.findByUserIdAndMovieId(user.getId(), movieId)
                .map(r -> r.getRating().intValue())   // Byte -> Integer
                .orElse(null);

        return new MovieStatusResponse(inWatchlist, isWatched, isFavorite, myRating);
    }
}
