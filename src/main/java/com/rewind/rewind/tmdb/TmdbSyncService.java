package com.rewind.rewind.tmdb;

import com.rewind.rewind.actor.entity.Actor;
import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.entity.Director;
import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.externalrating.entity.ExternalRating;
import com.rewind.rewind.externalrating.entity.ExternalRatingSource;
import com.rewind.rewind.externalrating.repo.ExternalRatingRepository;
import com.rewind.rewind.genre.entity.Genre;
import com.rewind.rewind.genre.repo.GenreRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.similar.entity.SimilarMovie;
import com.rewind.rewind.similar.repo.SimilarMovieRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TmdbSyncService {
    private final TmdbClient tmdb;
    private final MovieRepository movies;
    private final GenreRepository genres;
    private final ActorRepository actors;
    private final DirectorRepository directors;
    private final MovieActorRepository movieActors;
    private final MovieDirectorRepository movieDirectors;
    private final ExternalRatingRepository externalRatings;
    private final SimilarMovieRepository similarMovies;

    public TmdbSyncService(
            TmdbClient tmdb,
            MovieRepository movies,
            GenreRepository genres,
            ActorRepository actors,
            DirectorRepository directors,
            MovieActorRepository movieActors,
            MovieDirectorRepository movieDirectors,
            ExternalRatingRepository externalRatings,
            SimilarMovieRepository similarMovies
    ) {
        this.tmdb = tmdb;
        this.movies = movies;
        this.genres = genres;
        this.actors = actors;
        this.directors = directors;
        this.movieActors = movieActors;
        this.movieDirectors = movieDirectors;
        this.externalRatings = externalRatings;
        this.similarMovies = similarMovies;
    }

    @Transactional
    @CacheEvict(cacheNames = "movieDetails", key = "#movieId")
    public TmdbSyncResponse sync(Long movieId, TmdbSyncRequest request) {
        Movie movie = movies.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        TmdbClient.MovieData data = tmdb.fetchMovie(request.getTmdbId());

        if (data.imdbId() != null && !data.imdbId().isBlank()) {
            movies.findByImdbId(data.imdbId()).ifPresent(existing -> {
                if (!existing.getId().equals(movieId)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "IMDb id is already linked to another movie");
                }
            });
        }

        movie.setTmdbId(data.tmdbId());
        if (data.imdbId() != null && !data.imdbId().isBlank()) movie.setImdbId(data.imdbId());
        if (data.title() != null && !data.title().isBlank()) movie.setTitle(data.title());
        movie.setDurationMinutes(data.runtime());
        movie.setReleaseDate(data.releaseDate());
        movie.setShortPlot(blankToNull(data.overview()));
        movie.setPhotoUrl(data.posterUrl());
        movie.setBackdropUrl(data.backdropUrl());
        movie.setTrailerUrl(data.trailerUrl());
        movies.save(movie);

        List<Genre> resolvedGenres = data.genres().stream().map(this::resolveGenre).toList();
        movie.getGenres().clear();
        movie.getGenres().addAll(resolvedGenres);

        movieActors.deleteByIdMovieId(movieId);
        List<MovieActor> resolvedActors = data.cast().stream()
                .map(cast -> new MovieActor(movie, resolveActor(cast), cast.characterName(), cast.castOrder()))
                .toList();
        movieActors.saveAll(resolvedActors);

        movieDirectors.deleteByIdMovieId(movieId);
        List<MovieDirector> resolvedDirectors = data.directors().stream()
                .map(crew -> new MovieDirector(movie, resolveDirector(crew)))
                .toList();
        movieDirectors.saveAll(resolvedDirectors);

        updateTmdbRating(movie, data);

        int linkedSimilar = 0;
        if (request.isSyncSimilar()) {
            linkedSimilar = syncSimilar(movie, data.similarTmdbIds());
        }

        return new TmdbSyncResponse(movieId, data.tmdbId(), movie.getTitle(), resolvedGenres.size(),
                resolvedActors.size(), resolvedDirectors.size(), linkedSimilar,
                data.trailerUrl() != null && !data.trailerUrl().isBlank());
    }

    private Genre resolveGenre(TmdbClient.GenreData data) {
        Genre genre = genres.findByTmdbId(data.tmdbId())
                .or(() -> genres.findByNameIgnoreCase(data.name()))
                .orElseGet(Genre::new);
        genre.setTmdbId(data.tmdbId());
        genre.setName(data.name());
        return genres.save(genre);
    }

    private Actor resolveActor(TmdbClient.CastData data) {
        Actor actor = actors.findByTmdbId(data.tmdbId())
                .or(() -> actors.findByNameIgnoreCase(data.name()))
                .orElseGet(Actor::new);
        actor.setTmdbId(data.tmdbId());
        actor.setName(data.name());
        actor.setPhotoUrl(data.photoUrl());
        return actors.save(actor);
    }

    private Director resolveDirector(TmdbClient.CrewData data) {
        Director director = directors.findByTmdbId(data.tmdbId())
                .or(() -> directors.findByNameIgnoreCase(data.name()))
                .orElseGet(Director::new);
        director.setTmdbId(data.tmdbId());
        director.setName(data.name());
        director.setPhotoUrl(data.photoUrl());
        return directors.save(director);
    }

    private void updateTmdbRating(Movie movie, TmdbClient.MovieData data) {
        if (data.voteAverage() == null) return;
        ExternalRating rating = externalRatings.findByMovieIdAndSource(movie.getId(), ExternalRatingSource.TMDB)
                .orElseGet(() -> new ExternalRating(movie, ExternalRatingSource.TMDB,
                        data.voteAverage(), data.voteCount(), Instant.now()));
        rating.setRating(data.voteAverage());
        rating.setVotesCount(data.voteCount());
        rating.setLastUpdatedAt(Instant.now());
        externalRatings.save(rating);
    }

    private int syncSimilar(Movie movie, List<Long> tmdbIds) {
        similarMovies.deleteByIdMovieId(movie.getId());
        if (tmdbIds == null || tmdbIds.isEmpty()) return 0;
        Map<Long, Movie> localMovies = new HashMap<>();
        movies.findAllByTmdbIdIn(tmdbIds).forEach(candidate -> localMovies.put(candidate.getTmdbId(), candidate));
        List<SimilarMovie> links = tmdbIds.stream()
                .map(localMovies::get)
                .filter(candidate -> candidate != null && !candidate.getId().equals(movie.getId()))
                .distinct()
                .limit(6)
                .map(candidate -> new SimilarMovie(movie, candidate))
                .toList();
        similarMovies.saveAll(links);
        return links.size();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
