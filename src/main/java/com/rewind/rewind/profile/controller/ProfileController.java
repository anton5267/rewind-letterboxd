package com.rewind.rewind.profile.controller;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.dto.ProfileResponse;
import com.rewind.rewind.profile.dto.ProfileUpdateRequest;
import com.rewind.rewind.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public ProfileResponse me(Authentication auth) {
        return service.myProfile(auth.getName());
    }

    @GetMapping("/me/watched")
    public Page<MovieCardResponse> myWatched(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.mySystemCollection(auth.getName(), ListType.WATCHED, page, size);
    }

    @GetMapping("/me/watchlist")
    public Page<MovieCardResponse> myWatchlist(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.mySystemCollection(auth.getName(), ListType.WATCHLIST, page, size);
    }

    @GetMapping("/me/favorites")
    public Page<MovieCardResponse> myFavorites(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.mySystemCollection(auth.getName(), ListType.FAVORITES, page, size);
    }

    @PatchMapping("/me")
    public ProfileResponse updateMe(Authentication auth, @Valid @RequestBody ProfileUpdateRequest req) {
        return service.updateMyProfile(auth.getName(), req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
        try {
            service.changeMyPassword(auth.getName(), req); // <-- ОЦЕ ГОЛОВНА ПРАВКА
            return ResponseEntity.ok("Password changed");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
