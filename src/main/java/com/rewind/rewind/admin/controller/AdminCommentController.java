package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminCommentResponse;
import com.rewind.rewind.admin.dto.ModerateReviewRequest;
import com.rewind.rewind.admin.service.AdminCommentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/comments")
public class AdminCommentController {
    private final AdminCommentService service;
    public AdminCommentController(AdminCommentService service) { this.service = service; }

    @GetMapping
    public Page<AdminCommentResponse> list(@RequestParam(required = false) Boolean hidden,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return service.list(hidden, page, size);
    }

    @PostMapping("/{id}/hide")
    public AdminCommentResponse hide(Authentication auth, @PathVariable Long id, @Valid @RequestBody ModerateReviewRequest req) {
        return service.hide(id, auth.getName(), req.getReason());
    }

    @PostMapping("/{id}/unhide")
    public AdminCommentResponse unhide(Authentication auth, @PathVariable Long id) {
        return service.unhide(id, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
