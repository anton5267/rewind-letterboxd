package com.rewind.rewind.movie.service;

import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.externalrating.repo.ExternalRatingRepository;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.dto.MovieDetailsResponse;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.similar.repo.SimilarMovieRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MovieDetailsService {

    private final MovieRepository movies;
    private final MovieActorRepository movieActors;
    private final MovieDirectorRepository movieDirectors;
    private final ExternalRatingRepository externalRatings;
    private final SimilarMovieRepository similarMovies;

    private final UserRepository users;
    private final MovieListRepository lists;
    private final ListItemRepository listItems;

    public MovieDetailsService(
            MovieRepository movies,
            MovieActorRepository movieActors,
            MovieDirectorRepository movieDirectors,
            ExternalRatingRepository externalRatings,
            SimilarMovieRepository similarMovies,
            UserRepository users,
            MovieListRepository lists,
            ListItemRepository listItems
    ) {
        this.movies = movies;
        this.movieActors = movieActors;
        this.movieDirectors = movieDirectors;
        this.externalRatings = externalRatings;
        this.similarMovies = similarMovies;
        this.users = users;
        this.lists = lists;
        this.listItems = listItems;
    }

    @Transactional(readOnly = true)
    public MovieDetailsResponse getDetails(Long movieId, String userEmailOrNull) {
        Movie m = movies.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        // Genres (ManyToMany може бути LAZY, але транзакція це покриє)
        var genres = m.getGenres().stream()
                .map(g -> new MovieDetailsResponse.IdNameDto(g.getId(), g.getName()))
                .toList();

        // Directors (через repo)
        var directors = movieDirectors.findById_MovieId(movieId).stream()
                .map(md -> new MovieDetailsResponse.PersonDto(
                        md.getDirector().getId(),
                        md.getDirector().getName(),
                        md.getDirector().getPhotoUrl()
                ))
                .toList();

        // Actors (через repo)
        var actors = movieActors.findById_MovieIdOrderByCastOrderAsc(movieId).stream()
                .map(ma -> new MovieDetailsResponse.ActorRoleDto(
                        ma.getActor().getId(),
                        ma.getActor().getName(),
                        ma.getActor().getPhotoUrl(),
                        ma.getCharacterName(),
                        ma.getCastOrder()
                ))
                .toList();

        // External ratings
        var ext = externalRatings.findByMovieId(movieId).stream()
                .map(er -> new MovieDetailsResponse.ExternalRatingDto(
                        er.getSource().name(),
                        er.getRating(),
                        er.getVotesCount(),
                        er.getLastUpdatedAt()
                ))
                .toList();

        // Similar movies
        var similar = similarMovies.findById_MovieId(movieId).stream()
                .map(sm -> sm.getSimilarMovie())
                .map(x -> new MovieCardResponse(
                        x.getId(),
                        x.getTitle(),
                        x.getReleaseDate(),
                        x.getRating(),
                        x.getPhotoUrl()
                ))
                .toList();

        // My flags (не валимо весь endpoint, якщо у юзера нема системних списків)
        MovieDetailsResponse.MyFlags flags = null;
        if (userEmailOrNull != null) {
            var user = users.findByEmail(userEmailOrNull).orElseThrow();

            var watchedOpt = lists.findByUserAndListType(user, ListType.WATCHED);
            var watchlistOpt = lists.findByUserAndListType(user, ListType.WATCHLIST);
            var favoritesOpt = lists.findByUserAndListType(user, ListType.FAVORITES);

            boolean watched = watchedOpt.isPresent() && listItems.existsByListIdAndMovieId(watchedOpt.get().getId(), movieId);
            boolean watchlist = watchlistOpt.isPresent() && listItems.existsByListIdAndMovieId(watchlistOpt.get().getId(), movieId);
            boolean favorites = favoritesOpt.isPresent() && listItems.existsByListIdAndMovieId(favoritesOpt.get().getId(), movieId);

            flags = new MovieDetailsResponse.MyFlags(watched, watchlist, favorites);
        }

        return new MovieDetailsResponse(
                m.getId(), m.getImdbId(), m.getTitle(), m.getDurationMinutes(), m.getReleaseDate(),
                m.getAgeRating(), m.getRating(), m.getShortPlot(),
                m.getPhotoUrl(), m.getBackdropUrl(), m.getTrailerUrl(),
                genres, directors, actors,
                ext, similar,
                flags
        );
    }
}
