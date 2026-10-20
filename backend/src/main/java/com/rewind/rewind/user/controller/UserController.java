package com.rewind.rewind.user.controller;

import com.rewind.rewind.user.dto.UserResponse;
import com.rewind.rewind.user.dto.PublicUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.user.dto.PublicProfileResponse;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.list.dto.PublicListCardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository users;
    private final ProfileService profiles;

    public UserController(UserRepository users, ProfileService profiles) {
        this.users = users;
        this.profiles = profiles;
    }

    @GetMapping("/{id}/profile")
    public PublicProfileResponse publicProfile(@PathVariable Long id) {
        return profiles.publicProfile(id);
    }

    @GetMapping("/hq")
    public Page<PublicUserResponse> hqUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return users.findAllByIsHqTrueAndIsActiveTrue(PageRequest.of(
                        Math.max(0, page), Math.max(1, Math.min(size, 50)),
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .map(u -> new PublicUserResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()));
    }

    @GetMapping("/directory")
    public Page<PublicUserResponse> directory(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        String query = q == null ? null : q.trim();
        return users.searchPublicDirectory(query == null || query.isBlank() ? null : query, PageRequest.of(
                        Math.max(0, page), Math.max(1, Math.min(size, 50)),
                        Sort.by(Sort.Order.asc("username"), Sort.Order.asc("id"))))
                .map(u -> new PublicUserResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()));
    }

    @GetMapping("/{id}/collections/{collection}")
    public Page<MovieCardResponse> publicCollection(
            @PathVariable Long id,
            @PathVariable String collection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        ListType type = switch (collection) {
            case "watched" -> ListType.WATCHED;
            case "watchlist" -> ListType.WATCHLIST;
            case "favorites" -> ListType.FAVORITES;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown collection");
        };
        return profiles.publicSystemCollection(id, type, page, size);
    }

    @GetMapping("/{id}/lists")
    public Page<PublicListCardResponse> publicLists(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return profiles.publicLists(id, page, size);
    }

    @GetMapping("/{id}/liked-reviews")
    public Page<PublicProfileResponse.PublicReview> likedReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return profiles.publicLikedReviews(id, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicUserResponse> getById(@PathVariable Long id) {
        return users.findById(id)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .map(u -> new PublicUserResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        String email = auth.getName();

        return users.findByEmail(email)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole().name(),
                u.getAvatarUrl()
        );
    }
}
