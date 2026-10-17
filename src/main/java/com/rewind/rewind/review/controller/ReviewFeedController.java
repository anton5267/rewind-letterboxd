package com.rewind.rewind.review.controller;

import com.rewind.rewind.review.dto.RecentReviewResponse;
import com.rewind.rewind.review.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewFeedController {
    private final ReviewService reviews;

    public ReviewFeedController(ReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping("/recent")
    public Page<RecentReviewResponse> recent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        return reviews.recent(page, size);
    }
}
