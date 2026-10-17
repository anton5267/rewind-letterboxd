package com.rewind.rewind.comment.controller;

import com.rewind.rewind.comment.dto.CommentResponse;
import com.rewind.rewind.comment.dto.CreateCommentRequest;
import com.rewind.rewind.comment.service.ReviewCommentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewCommentController {
    private final ReviewCommentService comments;

    public ReviewCommentController(ReviewCommentService comments) { this.comments = comments; }

    @GetMapping("/{reviewId}/comments")
    public Page<CommentResponse> list(@PathVariable Long reviewId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return comments.list(reviewId, page, size);
    }

    @PostMapping("/{reviewId}/comments")
    public CommentResponse create(Authentication auth, @PathVariable Long reviewId,
                                  @Valid @RequestBody CreateCommentRequest request) {
        return comments.create(auth.getName(), reviewId, request);
    }
}
