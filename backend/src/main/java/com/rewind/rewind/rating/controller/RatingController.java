package com.rewind.rewind.rating.controller;

import com.rewind.rewind.rating.dto.MyRatingResponse;
import com.rewind.rewind.rating.dto.UpsertRatingRequest;
import com.rewind.rewind.rating.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class RatingController {

    private final RatingService service;

    public RatingController(RatingService service) {
        this.service = service;
    }

    @PutMapping("/{movieId}/rating")
    public ResponseEntity<?> upsert(Authentication auth, @PathVariable Long movieId, @Valid @RequestBody UpsertRatingRequest req) {
        service.upsert(auth.getName(), movieId, req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{movieId}/rating/me")
    public ResponseEntity<MyRatingResponse> my(Authentication auth, @PathVariable Long movieId) {
        return service.getMyRating(auth.getName(), movieId)
                .map(r -> ResponseEntity.ok(new MyRatingResponse(r)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @DeleteMapping("/{movieId}/rating")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable Long movieId) {
        service.deleteMyRating(auth.getName(), movieId);
        return ResponseEntity.noContent().build();
    }
}
