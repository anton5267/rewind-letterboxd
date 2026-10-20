package com.rewind.rewind.list.controller.system;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.service.system.SystemListItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class SystemListsController {

    private final SystemListItemService service;

    public SystemListsController(SystemListItemService service) {
        this.service = service;
    }

    @PostMapping("/{movieId}/watchlist")
    public ResponseEntity<?> addWatchlist(Authentication auth, @PathVariable Long movieId) {
        service.add(auth.getName(), movieId, ListType.WATCHLIST);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{movieId}/watchlist")
    public ResponseEntity<?> removeWatchlist(Authentication auth, @PathVariable Long movieId) {
        service.remove(auth.getName(), movieId, ListType.WATCHLIST);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{movieId}/watched")
    public ResponseEntity<?> addWatched(Authentication auth, @PathVariable Long movieId) {
        service.add(auth.getName(), movieId, ListType.WATCHED);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{movieId}/watched")
    public ResponseEntity<?> removeWatched(Authentication auth, @PathVariable Long movieId) {
        service.remove(auth.getName(), movieId, ListType.WATCHED);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{movieId}/favorite")
    public ResponseEntity<?> addFavorite(Authentication auth, @PathVariable Long movieId) {
        service.add(auth.getName(), movieId, ListType.FAVORITES);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{movieId}/favorite")
    public ResponseEntity<?> removeFavorite(Authentication auth, @PathVariable Long movieId) {
        service.remove(auth.getName(), movieId, ListType.FAVORITES);
        return ResponseEntity.noContent().build();
    }
}
