package com.rewind.rewind.review.service;

import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.dto.ReviewResponse;
import com.rewind.rewind.review.dto.RecentReviewResponse;
import com.rewind.rewind.review.dto.UpdateReviewRequest;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final UserRepository users;
    private final MovieRepository movies;
    private final RatingService ratingService;
    private final ActivityService activities;

    public ReviewService(ReviewRepository reviews, UserRepository users, MovieRepository movies, RatingService ratingService, ActivityService activities) {
        this.reviews = reviews;
        this.users = users;
        this.movies = movies;
        this.ratingService = ratingService;
        this.activities = activities;
    }

    @Transactional
    public ReviewResponse create(String email, Long movieId, CreateReviewRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        var movie = movies.findById(movieId).orElseThrow(() -> new IllegalArgumentException("Movie not found"));
        if (reviews.existsByUserIdAndMovieId(user.getId(), movieId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this movie");
        }

        Review r = new Review();
        r.setUser(user);
        r.setMovie(movie);
        r.setContent(req.getContent());
        r.setRating(req.getRating().byteValue());

        Review saved;
        try {
            // Flush here so a concurrent request that wins the unique
            // (user_id, movie_id) constraint becomes a stable HTTP 409
            // instead of surfacing as a late transaction/500 error.
            saved = reviews.saveAndFlush(r);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this movie", ex);
        }

        // ✅ синхронізуємо таблицю ratings + оновлюється movies.rating
        UpsertRatingRequest rr = new UpsertRatingRequest();
        rr.setRating(req.getRating());
        ratingService.upsertForReview(email, movieId, rr);
        activities.record(user.getId(), ActivityType.REVIEW, movieId, saved.getId(), null, null);

        return new ReviewResponse(
                saved.getId(),
                user.getId(),
                user.getUsername(),
                user.getAvatarUrl(),
                saved.getContent(),
                saved.getRating() == null ? null : saved.getRating().intValue(),
                saved.getCreatedAt()
        );
    }

    public Page<ReviewResponse> listByMovie(Long movieId, int page, int size) {
        var p = reviews.findAllByMovieIdAndIsHiddenFalse(movieId,
                PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50))));
        return p.map(r -> new ReviewResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getUsername(),
                r.getUser().getAvatarUrl(),
                r.getContent(),
                r.getRating() == null ? null : r.getRating().intValue(),
                r.getCreatedAt()
        ));
    }

    @Transactional(readOnly = true)
    public Page<RecentReviewResponse> recent(int page, int size) {
        return reviews.findAllByIsHiddenFalseOrderByCreatedAtDesc(
                        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 20))))
                .map(review -> new RecentReviewResponse(
                        review.getId(),
                        review.getMovie().getId(),
                        review.getMovie().getTitle(),
                        review.getUser().getId(),
                        review.getUser().getUsername(),
                        review.getContent(),
                        review.getRating() == null ? null : review.getRating().intValue(),
                        review.getCreatedAt()
                ));
    }

    @Transactional(readOnly = true)
    public Optional<ReviewResponse> myReview(String email, Long movieId) {
        var user = users.findByEmail(email).orElseThrow();
        return reviews.findByUserIdAndMovieId(user.getId(), movieId)
                .map(r -> new ReviewResponse(r.getId(), user.getId(), user.getUsername(), user.getAvatarUrl(),
                        r.getContent(), r.getRating() == null ? null : r.getRating().intValue(), r.getCreatedAt()));
    }

    // ✅ РЕДАГУВАННЯ СВОГО ОГЛЯДУ
    @Transactional
    public ReviewResponse updateMy(String email, Long reviewId, UpdateReviewRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        var r = reviews.findByIdAndUserId(reviewId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (req.getContent() != null) {
            r.setContent(req.getContent());
        }

        if (req.getRating() != null) {
            r.setRating(req.getRating().byteValue());

            // ✅ синхронізуємо ratings + оновлюємо movies.rating
            UpsertRatingRequest rr = new UpsertRatingRequest();
            rr.setRating(req.getRating());
            ratingService.upsertForReview(email, r.getMovie().getId(), rr);
        }

        Review saved = reviews.save(r);

        return new ReviewResponse(
                saved.getId(),
                saved.getUser().getId(),
                saved.getUser().getUsername(),
                saved.getUser().getAvatarUrl(),
                saved.getContent(),
                saved.getRating() == null ? null : saved.getRating().intValue(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void deleteMy(String email, Long reviewId) {
        var user = users.findByEmail(email).orElseThrow();
        var r = reviews.findByIdAndUserId(reviewId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        reviews.delete(r);
    }
}
