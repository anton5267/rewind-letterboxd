package com.rewind.rewind.movie.service.admin;

import com.rewind.rewind.genre.entity.Genre;
import com.rewind.rewind.genre.repo.GenreRepository;
import com.rewind.rewind.actor.entity.Actor;
import com.rewind.rewind.actor.entity.MovieActor;
import com.rewind.rewind.actor.repo.ActorRepository;
import com.rewind.rewind.actor.repo.MovieActorRepository;
import com.rewind.rewind.director.entity.Director;
import com.rewind.rewind.director.entity.MovieDirector;
import com.rewind.rewind.director.repo.DirectorRepository;
import com.rewind.rewind.director.repo.MovieDirectorRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.dto.admin.ActorCreditWriteRequest;
import com.rewind.rewind.movie.dto.admin.AdminMovieCatalogResponse;
import com.rewind.rewind.movie.dto.admin.CreateMovieRequest;
import com.rewind.rewind.movie.dto.admin.UpdateMovieRequest;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.producer.entity.Producer;
import com.rewind.rewind.producer.entity.MovieProducer;
import com.rewind.rewind.producer.repo.ProducerRepository;
import com.rewind.rewind.producer.repo.MovieProducerRepository;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Set;

@Service
public class AdminMovieService {

    private final MovieRepository movies;
    private final GenreRepository genres;
    private final ActorRepository actors;
    private final MovieActorRepository movieActors;
    private final DirectorRepository directors;
    private final MovieDirectorRepository movieDirectors;
    private final ProducerRepository producers;
    private final MovieProducerRepository movieProducers;

    public AdminMovieService(MovieRepository movies, GenreRepository genres, ActorRepository actors,
                             MovieActorRepository movieActors, DirectorRepository directors,
                             MovieDirectorRepository movieDirectors, ProducerRepository producers,
                             MovieProducerRepository movieProducers) {
        this.movies = movies;
        this.genres = genres;
        this.actors = actors;
        this.movieActors = movieActors;
        this.directors = directors;
        this.movieDirectors = movieDirectors;
        this.producers = producers;
        this.movieProducers = movieProducers;
    }

    @Transactional
    public MovieCardResponse create(CreateMovieRequest req) {
        if (req.wasProvided(CreateMovieRequest.Field.GENRE_IDS) && req.getGenreIds() == null)
            throw new IllegalArgumentException("genreIds must be an array");
        if (req.wasProvided(CreateMovieRequest.Field.ACTOR_CREDITS) && req.getActorCredits() == null)
            throw new IllegalArgumentException("actorCredits must be an array");
        if (req.wasProvided(CreateMovieRequest.Field.DIRECTOR_IDS) && req.getDirectorIds() == null)
            throw new IllegalArgumentException("directorIds must be an array");
        if (req.wasProvided(CreateMovieRequest.Field.PRODUCER_IDS) && req.getProducerIds() == null)
            throw new IllegalArgumentException("producerIds must be an array");
        Movie m = new Movie();
        m.setTitle(req.getTitle());
        m.setImdbId(req.getImdbId());
        m.setOriginalLanguage(normalizeLanguage(req.getOriginalLanguage()));
        m.setDurationMinutes(req.getDurationMinutes());
        m.setReleaseDate(req.getReleaseDate());
        m.setAgeRating(req.getAgeRating());
        m.setRating(req.getRating());
        m.setShortPlot(req.getShortPlot());
        m.setPhotoUrl(req.getPhotoUrl());
        m.setBackdropUrl(req.getBackdropUrl());
        m.setTrailerUrl(req.getTrailerUrl());
        if (req.wasProvided(CreateMovieRequest.Field.GENRE_IDS)) {
            m.setGenres(resolveGenres(req.getGenreIds()));
        }

        Movie saved = movies.save(m);
        if (req.wasProvided(CreateMovieRequest.Field.ACTOR_CREDITS)) {
            replaceActorCredits(saved, req.getActorCredits());
        }
        if (req.wasProvided(CreateMovieRequest.Field.DIRECTOR_IDS)) {
            replaceDirectors(saved, req.getDirectorIds());
        }
        if (req.wasProvided(CreateMovieRequest.Field.PRODUCER_IDS)) {
            replaceProducers(saved, req.getProducerIds());
        }
        return toCard(saved);
    }

    public Page<MovieCardResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "id"));
        return movies.findAll(pageable).map(this::toCard);
    }

    public Page<AdminMovieCatalogResponse> listCatalog(int page, int size, String query) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "id"));
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        if (normalizedQuery != null && normalizedQuery.length() > 120) {
            throw new IllegalArgumentException("Movie search is too long");
        }
        return movies.findAdminMovieCatalog(normalizedQuery, pageable);
    }

    @CacheEvict(cacheNames = "movieDetails", key = "#id")
    @Transactional
    public MovieCardResponse update(Long id, UpdateMovieRequest req) {
        Movie m = movies.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        if (req.wasProvided(UpdateMovieRequest.Field.GENRE_IDS) && req.getGenreIds() == null)
            throw new IllegalArgumentException("genreIds must be an array");
        if (req.wasProvided(UpdateMovieRequest.Field.ACTOR_CREDITS) && req.getActorCredits() == null)
            throw new IllegalArgumentException("actorCredits must be an array");
        if (req.wasProvided(UpdateMovieRequest.Field.DIRECTOR_IDS) && req.getDirectorIds() == null)
            throw new IllegalArgumentException("directorIds must be an array");
        if (req.wasProvided(UpdateMovieRequest.Field.PRODUCER_IDS) && req.getProducerIds() == null)
            throw new IllegalArgumentException("producerIds must be an array");

        if (req.getTitle() != null) m.setTitle(req.getTitle());
        if (req.wasProvided(UpdateMovieRequest.Field.IMDB_ID)) m.setImdbId(req.getImdbId());
        if (req.wasProvided(UpdateMovieRequest.Field.ORIGINAL_LANGUAGE)) m.setOriginalLanguage(normalizeLanguage(req.getOriginalLanguage()));
        if (req.wasProvided(UpdateMovieRequest.Field.DURATION_MINUTES)) m.setDurationMinutes(req.getDurationMinutes());
        if (req.wasProvided(UpdateMovieRequest.Field.RELEASE_DATE)) m.setReleaseDate(req.getReleaseDate());
        if (req.wasProvided(UpdateMovieRequest.Field.AGE_RATING)) m.setAgeRating(req.getAgeRating());
        if (req.wasProvided(UpdateMovieRequest.Field.RATING)) m.setRating(req.getRating());
        if (req.wasProvided(UpdateMovieRequest.Field.SHORT_PLOT)) m.setShortPlot(req.getShortPlot());
        if (req.wasProvided(UpdateMovieRequest.Field.PHOTO_URL)) m.setPhotoUrl(req.getPhotoUrl());
        if (req.wasProvided(UpdateMovieRequest.Field.BACKDROP_URL)) m.setBackdropUrl(req.getBackdropUrl());
        if (req.wasProvided(UpdateMovieRequest.Field.TRAILER_URL)) m.setTrailerUrl(req.getTrailerUrl());
        if (req.wasProvided(UpdateMovieRequest.Field.GENRE_IDS)) {
            m.setGenres(resolveGenres(req.getGenreIds()));
        }

        Movie saved = movies.save(m);
        if (req.wasProvided(UpdateMovieRequest.Field.ACTOR_CREDITS)) {
            replaceActorCredits(saved, req.getActorCredits());
        }
        if (req.wasProvided(UpdateMovieRequest.Field.DIRECTOR_IDS)) {
            replaceDirectors(saved, req.getDirectorIds());
        }
        if (req.wasProvided(UpdateMovieRequest.Field.PRODUCER_IDS)) {
            replaceProducers(saved, req.getProducerIds());
        }
        return toCard(saved);
    }

    @CacheEvict(cacheNames = "movieDetails", key = "#id")
    public void delete(Long id) {
        if (!movies.existsById(id)) {
            throw new IllegalArgumentException("Movie not found");
        }
        movies.deleteById(id);
    }

    private MovieCardResponse toCard(Movie m) {
        return new MovieCardResponse(
                m.getId(),
                m.getTmdbId(),
                m.getTitle(),
                m.getReleaseDate(),
                m.getRating(),
                m.getPhotoUrl()
        );
    }

    private String normalizeLanguage(String language) {
        if (language == null) return null;
        String normalized = language.trim().toLowerCase(java.util.Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private Set<Genre> resolveGenres(List<Long> genreIds) {
        Set<Long> distinctIds = new HashSet<>(genreIds);
        if (distinctIds.size() != genreIds.size()) throw new IllegalArgumentException("genreIds must be unique");
        List<Genre> found = genres.findAllById(distinctIds);
        if (found.size() != distinctIds.size()) throw new IllegalArgumentException("One or more genres were not found");
        return new HashSet<>(found);
    }

    private void replaceActorCredits(Movie movie, List<ActorCreditWriteRequest> credits) {
        List<Long> ids = credits.stream().map(ActorCreditWriteRequest::actorId).toList();
        Map<Long, Actor> byId = resolvePeople(ids, actors::findAllById, Actor::getId, "actors");
        movieActors.deleteByIdMovieId(movie.getId());
        movieActors.saveAll(credits.stream().map(credit -> new MovieActor(movie, byId.get(credit.actorId()),
                credit.characterName(), credit.castOrder())).toList());
    }

    private void replaceDirectors(Movie movie, List<Long> ids) {
        Map<Long, Director> byId = resolvePeople(ids, directors::findAllById, Director::getId, "directors");
        movieDirectors.deleteByIdMovieId(movie.getId());
        movieDirectors.saveAll(ids.stream().map(id -> new MovieDirector(movie, byId.get(id))).toList());
    }

    private void replaceProducers(Movie movie, List<Long> ids) {
        Map<Long, Producer> byId = resolvePeople(ids, producers::findAllById, Producer::getId, "producers");
        movieProducers.deleteByIdMovieId(movie.getId());
        movieProducers.saveAll(ids.stream().map(id -> new MovieProducer(movie, byId.get(id))).toList());
    }

    private <T> Map<Long, T> resolvePeople(List<Long> ids, Function<Iterable<Long>, List<T>> loader,
                                            Function<T, Long> idExtractor, String label) {
        Set<Long> distinctIds = new HashSet<>(ids);
        if (distinctIds.size() != ids.size()) throw new IllegalArgumentException(label + " IDs must be unique");
        List<T> found = loader.apply(distinctIds);
        if (found.size() != distinctIds.size()) throw new IllegalArgumentException("One or more " + label + " were not found");
        return found.stream().collect(Collectors.toMap(idExtractor, Function.identity()));
    }
}
