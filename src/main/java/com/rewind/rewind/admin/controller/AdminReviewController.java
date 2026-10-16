package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminReviewResponse;
import com.rewind.rewind.admin.dto.ModerateReviewRequest;
import com.rewind.rewind.admin.service.AdminReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    private final AdminReviewService service;

    public AdminReviewController(AdminReviewService service) {
        this.service = service;
    }

    @GetMapping
    public Page<AdminReviewResponse> list(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Boolean hidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(movieId, userId, hidden, page, size);
    }

    @PostMapping("/{id}/hide")
    public AdminReviewResponse hide(Authentication auth, @PathVariable Long id, @Valid @RequestBody ModerateReviewRequest req) {
        return service.hide(id, auth.getName(), req.getReason());
    }

    @PostMapping("/{id}/unhide")
    public AdminReviewResponse unhide(Authentication auth, @PathVariable Long id) {
        return service.unhide(id, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
