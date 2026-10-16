package com.rewind.rewind.review.controller;

import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.dto.ReviewResponse;
import com.rewind.rewind.review.dto.UpdateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    // public: подивитись відгуки по фільму
    @GetMapping("/api/movies/{movieId}/reviews")
    public Page<ReviewResponse> list(@PathVariable Long movieId,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size) {
        return service.listByMovie(movieId, page, size);
    }

    // protected: створити відгук (текст + оцінка)
    @PostMapping("/api/movies/{movieId}/reviews")
    public ReviewResponse create(Authentication auth, @PathVariable Long movieId, @Valid @RequestBody CreateReviewRequest req) {
        return service.create(auth.getName(), movieId, req);
    }

    // protected: редагувати свій відгук (текст і/або оцінка)
    @PatchMapping("/api/reviews/{reviewId}")
    public ReviewResponse update(Authentication auth, @PathVariable Long reviewId, @Valid @RequestBody UpdateReviewRequest req) {
        return service.updateMy(auth.getName(), reviewId, req);
    }

    // protected: видалити свій відгук
    @DeleteMapping("/api/reviews/{reviewId}")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable Long reviewId) {
        service.deleteMy(auth.getName(), reviewId);
        return ResponseEntity.noContent().build();
    }
}
