package com.rewind.rewind.rating.service;

import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.entity.Rating;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RatingService {

    private final RatingRepository ratings;
    private final UserRepository users;
    private final MovieRepository movies;

    public RatingService(RatingRepository ratings, UserRepository users, MovieRepository movies) {
        this.ratings = ratings;
        this.users = users;
        this.movies = movies;
    }

    @Transactional
    public void upsert(String email, Long movieId, UpsertRatingRequest req) {
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
