package com.rewind.rewind.comment.controller;

import com.rewind.rewind.comment.dto.CommentResponse;
import com.rewind.rewind.comment.dto.UpdateCommentRequest;
import com.rewind.rewind.comment.service.ReviewCommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final ReviewCommentService comments;

    public CommentController(ReviewCommentService comments) { this.comments = comments; }

    @PatchMapping("/{commentId}")
    public CommentResponse update(Authentication auth, @PathVariable Long commentId,
                                  @Valid @RequestBody UpdateCommentRequest request) {
        return comments.update(auth.getName(), commentId, request);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long commentId) {
        comments.delete(auth.getName(), commentId);
        return ResponseEntity.noContent().build();
    }
}
