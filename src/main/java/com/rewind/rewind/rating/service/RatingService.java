package com.rewind.rewind.rating.service;

import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.entity.Rating;
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
    private final ActivityService activities;

    public RatingService(RatingRepository ratings, UserRepository users, MovieRepository movies, ActivityService activities) {
        this.ratings = ratings;
        this.users = users;
        this.movies = movies;
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
        var movie = movies.findById(movieId).orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        var existing = ratings.findByUserIdAndMovieId(user.getId(), movieId);

        if (existing.isPresent()) {
            Rating r = existing.get();
            r.setRating(req.getRating().byteValue());
            ratings.saveAndFlush(r);
        } else {
            Rating r = new Rating();
            r.setUser(user);
            r.setMovie(movie);
            r.setRating(req.getRating().byteValue());
            ratings.saveAndFlush(r);
        }

        // ✅ перерахувати середнє і записати в movies.rating
        movies.recalcAverageRating(movieId);
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

        // ✅ перерахувати середнє і записати в movies.rating
        movies.recalcAverageRating(movieId);
    }
}
