package com.rewind.rewind.rating.service;

import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.movie.service.MovieDetailsCacheService;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RatingService {

    private final RatingRepository ratings;
    private final UserRepository users;
    private final MovieRepository movies;
    private final MovieDetailsCacheService movieDetailsCache;
    private final ActivityService activities;

    public RatingService(RatingRepository ratings, UserRepository users, MovieRepository movies, MovieDetailsCacheService movieDetailsCache, ActivityService activities) {
        this.ratings = ratings;
        this.users = users;
        this.movies = movies;
        this.movieDetailsCache = movieDetailsCache;
        this.activities = activities;
    }

    @Transactional
    public void upsert(String email, Long movieId, UpsertRatingRequest req) {
        upsert(email, movieId, req, true);
    }

    public void upsertForReview(String email, Long movieId, UpsertRatingRequest req) {
        upsert(email, movieId, req, false);
    }

    private void upsert(String email, Long movieId, UpsertRatingRequest req, boolean recordActivity) {
        var user = users.findByEmail(email).orElseThrow();
        if (!movies.existsById(movieId)) {
            throw new IllegalArgumentException("Movie not found");
        }

        // MySQL's unique key and atomic upsert make two simultaneous rating
        // requests idempotent instead of racing through a read-then-insert.
        ratings.upsertAtomic(user.getId(), movieId, req.getRating().byteValue());

        movies.recalcAverageRating(movieId);
        movieDetailsCache.evict(movieId);
        if (recordActivity) activities.record(user.getId(), ActivityType.RATING, movieId, null, null, null);
    }

    public Optional<Integer> getMyRating(String email, Long movieId) {
        var user = users.findByEmail(email).orElseThrow();
        var rating = ratings.findByUserIdAndMovieId(user.getId(), movieId);
        if (rating.isEmpty()) {
            return Optional.empty();
        }
        Byte value = rating.get().getRating();
        return value == null ? Optional.empty() : Optional.of(value.intValue());
    }

    @Transactional
    public void deleteMyRating(String email, Long movieId) {
        var user = users.findByEmail(email).orElseThrow();
        ratings.deleteByUserIdAndMovieId(user.getId(), movieId);
        ratings.flush();

        movies.recalcAverageRating(movieId);
        movieDetailsCache.evict(movieId);
    }
}
