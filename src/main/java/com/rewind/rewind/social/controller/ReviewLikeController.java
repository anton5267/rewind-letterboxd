package com.rewind.rewind.social.controller;

import com.rewind.rewind.social.dto.ReviewLikeResponse;
import com.rewind.rewind.social.service.ReviewLikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewLikeController {
    private final ReviewLikeService likes;
    public ReviewLikeController(ReviewLikeService likes) { this.likes = likes; }

    @GetMapping("/{reviewId}/likes")
    public long count(@PathVariable Long reviewId) { return likes.count(reviewId); }

    @GetMapping("/{reviewId}/like-status")
    public ReviewLikeResponse status(Authentication auth, @PathVariable Long reviewId) { return likes.status(auth.getName(), reviewId); }

    @PostMapping("/{reviewId}/likes")
    public ResponseEntity<Void> like(Authentication auth, @PathVariable Long reviewId) {
        likes.like(auth.getName(), reviewId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{reviewId}/likes")
    public ResponseEntity<Void> unlike(Authentication auth, @PathVariable Long reviewId) {
        likes.unlike(auth.getName(), reviewId);
        return ResponseEntity.noContent().build();
    }
}
