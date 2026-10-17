package com.rewind.rewind.social.controller;

import com.rewind.rewind.social.dto.FollowStatusResponse;
import com.rewind.rewind.social.service.FollowService;
import com.rewind.rewind.user.dto.PublicUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class FollowController {
    private final FollowService follows;

    public FollowController(FollowService follows) {
        this.follows = follows;
    }

    @GetMapping("/{id}/followers")
    public Page<PublicUserResponse> followers(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return follows.followers(id, page, size);
    }

    @GetMapping("/{id}/following")
    public Page<PublicUserResponse> following(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return follows.following(id, page, size);
    }

    @GetMapping("/{id}/follow-status")
    public FollowStatusResponse status(Authentication auth, @PathVariable Long id) {
        return follows.status(auth.getName(), id);
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> follow(Authentication auth, @PathVariable Long id) {
        follows.follow(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Void> unfollow(Authentication auth, @PathVariable Long id) {
        follows.unfollow(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
