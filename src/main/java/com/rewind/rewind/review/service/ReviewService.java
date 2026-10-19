package com.rewind.rewind.review.service;

import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.dto.ReviewResponse;
import com.rewind.rewind.review.dto.RecentReviewResponse;
import com.rewind.rewind.review.dto.ReviewDetailsResponse;
import com.rewind.rewind.review.dto.UpdateReviewRequest;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final UserRepository users;
    private final MovieRepository movies;
    private final RatingService ratingService;
    private final ActivityService activities;
    private final ReviewLikeRepository reviewLikes;

    public ReviewService(ReviewRepository reviews, UserRepository users, MovieRepository movies, RatingService ratingService,
                         ActivityService activities, ReviewLikeRepository reviewLikes) {
        this.reviews = reviews;
        this.users = users;
        this.movies = movies;
        this.ratingService = ratingService;
        this.activities = activities;
        this.reviewLikes = reviewLikes;
    }

    @Transactional
    public ReviewResponse create(String email, Long movieId, CreateReviewRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        movies.findById(movieId).orElseThrow(() -> new IllegalArgumentException("Movie not found"));
        int inserted = reviews.insertIgnore(user.getId(), movieId, req.getContent(), req.getRating().byteValue());
        if (inserted == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this movie");
        }

        Review saved = reviews.findByUserIdAndMovieId(user.getId(), movieId)
                .orElseThrow(() -> new IllegalStateException("Review insert was not persisted"));

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
        var p = reviews.findVisibleByMovieId(movieId,
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
    public ReviewDetailsResponse details(Long reviewId) {
        Review review = reviews.findVisibleDetailsById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        var author = review.getUser();
        var movie = review.getMovie();
        var likedBy = reviewLikes.findActiveByReviewId(reviewId, PageRequest.of(0, 12)).stream()
                .map(like -> new ReviewDetailsResponse.Liker(
                        like.getUser().getId(),
                        like.getUser().getUsername(),
                        like.getUser().getDisplayName(),
                        like.getUser().getAvatarUrl()))
                .toList();
        return new ReviewDetailsResponse(
                review.getId(),
                review.getContent(),
                review.getRating() == null ? null : review.getRating().intValue(),
                review.getCreatedAt(),
                new ReviewDetailsResponse.Author(author.getId(), author.getUsername(), author.getDisplayName(), author.getAvatarUrl()),
                new ReviewDetailsResponse.Movie(movie.getId(), movie.getTitle(), movie.getReleaseDate(), movie.getDurationMinutes(),
                        movie.getAgeRating(), movie.getPhotoUrl(), movie.getBackdropUrl(), movie.getTrailerUrl()),
                reviewLikes.countActiveByReviewId(reviewId),
                likedBy
        );
    }

    @Transactional(readOnly = true)
    public Page<RecentReviewResponse> recent(int page, int size) {
        return reviews.findVisibleRecent(
                        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 20))))
                .map(review -> toRecentReview(review));
    }

    @Transactional(readOnly = true)
    public Page<RecentReviewResponse> popular(int page, int size) {
        Page<Review> ranked = reviews.findPopularVisible(
                PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 20))));
        if (ranked.isEmpty()) {
            return new PageImpl<>(java.util.List.of(), ranked.getPageable(), ranked.getTotalElements());
        }
        List<Long> rankedIds = new ArrayList<>(ranked.getContent().size());
        for (Review review : ranked.getContent()) {
            rankedIds.add(review.getId());
        }

        Map<Long, Review> hydrated = new HashMap<>();
        for (Review review : reviews.findAllByIdIn(rankedIds)) {
            hydrated.put(review.getId(), review);
        }

        List<RecentReviewResponse> content = new ArrayList<>(ranked.getContent().size());
        for (Review review : ranked.getContent()) {
            content.add(toRecentReview(hydrated.getOrDefault(review.getId(), review)));
        }
        return new PageImpl<>(content, ranked.getPageable(), ranked.getTotalElements());
    }

    private RecentReviewResponse toRecentReview(Review review) {
        return new RecentReviewResponse(
                review.getId(),
                review.getMovie().getId(),
                review.getMovie().getTitle(),
                review.getUser().getId(),
                review.getUser().getUsername(),
                review.getContent(),
                review.getRating() == null ? null : review.getRating().intValue(),
                review.getCreatedAt(),
                review.getMovie().getPhotoUrl(),
                review.getUser().getAvatarUrl()
        );
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
