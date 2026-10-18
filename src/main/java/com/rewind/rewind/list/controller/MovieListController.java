package com.rewind.rewind.list.controller;

import com.rewind.rewind.list.dto.*;
import com.rewind.rewind.list.service.MovieListService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lists")
public class MovieListController {

    private final MovieListService service;

    public MovieListController(MovieListService service) {
        this.service = service;
    }

    @GetMapping("/my")
    public List<MovieListResponse> my(Authentication auth) {
        return service.myLists(auth.getName());
    }

    @GetMapping("/my/page")
    public Page<MovieListResponse> myPage(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return service.myListsPage(auth.getName(), page, size);
    }

    // All Lists (public lists of other users)
    @GetMapping("/public")
    public Page<PublicListCardResponse> publicLists(
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.publicLists(tag, page, size);
    }

    @GetMapping("/public/popular")
    public Page<PublicListCardResponse> popularPublicLists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.popularPublicLists(page, size);
    }

    @GetMapping("/public/recently-liked")
    public Page<PublicListCardResponse> recentlyLikedPublicLists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.recentlyLikedPublicLists(page, size);
    }

    @GetMapping("/public/team")
    public Page<PublicListCardResponse> teamPublicLists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.teamPublicLists(page, size);
    }

    @GetMapping("/public/{listId}")
    public PublicListDetailsResponse publicList(@PathVariable Long listId) {
        return service.publicList(listId);
    }

    @GetMapping("/public/{listId}/like-status")
    public com.rewind.rewind.social.dto.ListLikeResponse likeStatus(Authentication auth, @PathVariable Long listId) {
        return service.likeStatus(auth.getName(), listId);
    }

    @PostMapping("/{listId}/likes")
    public ResponseEntity<Void> like(Authentication auth, @PathVariable Long listId) {
        service.like(auth.getName(), listId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{listId}/likes")
    public ResponseEntity<Void> unlike(Authentication auth, @PathVariable Long listId) {
        service.unlike(auth.getName(), listId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public MovieListResponse create(Authentication auth, @Valid @RequestBody CreateListRequest req) {
        return service.create(auth.getName(), req);
    }

    // Edit List
    @PatchMapping("/{listId}")
    public MovieListResponse update(Authentication auth, @PathVariable Long listId, @Valid @RequestBody UpdateListRequest req) {
        return service.updateMyList(auth.getName(), listId, req);
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long listId) {
        service.deleteMyList(auth.getName(), listId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{listId}/items")
    public ResponseEntity<?> addItem(Authentication auth, @PathVariable Long listId, @Valid @RequestBody AddListItemRequest req) {
        service.addItem(auth.getName(), listId, req);
        return ResponseEntity.ok().build();
    }

    // Alias for frontend (frontend calls /movies)
    @PostMapping("/{listId}/movies")
    public ResponseEntity<?> addMovie(Authentication auth, @PathVariable Long listId, @Valid @RequestBody AddListItemRequest req) {
        service.addItem(auth.getName(), listId, req);
        return ResponseEntity.ok().build();
    }

    // List items with listItemId (needed for reorder)
    @GetMapping("/{listId}/items")
    public List<ListItemResponse> myListItems(Authentication auth, @PathVariable Long listId) {
        return service.myListItems(auth.getName(), listId);
    }

    // Reorder
    @PutMapping("/{listId}/items/reorder")
    public ResponseEntity<?> reorder(Authentication auth, @PathVariable Long listId, @Valid @RequestBody ReorderListItemsRequest req) {
        service.reorderMyListItems(auth.getName(), listId, req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{listId}/items/{movieId}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Long listId, @PathVariable Long movieId) {
        service.removeItem(auth.getName(), listId, movieId);
        return ResponseEntity.noContent().build();
    }

    // Alias for frontend
    @DeleteMapping("/{listId}/movies/{movieId}")
    public ResponseEntity<?> removeMovie(Authentication auth, @PathVariable Long listId, @PathVariable Long movieId) {
        service.removeItem(auth.getName(), listId, movieId);
        return ResponseEntity.noContent().build();
    }
}
