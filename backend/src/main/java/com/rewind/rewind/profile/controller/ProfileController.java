package com.rewind.rewind.profile.controller;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.dto.DeleteAccountRequest;
import com.rewind.rewind.profile.dto.ProfileResponse;
import com.rewind.rewind.profile.dto.ProfileUpdateRequest;
import com.rewind.rewind.profile.dto.SocialLinkRequest;
import com.rewind.rewind.profile.dto.SocialLinkResponse;
import com.rewind.rewind.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import java.util.List;
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

    @GetMapping("/me/ratings")
    public Page<ProfileResponse.ProfileRatingItem> myRatings(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.myRatings(auth.getName(), page, size);
    }

    @GetMapping("/me/reviews")
    public Page<ProfileResponse.ProfileReviewItem> myReviews(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.myReviews(auth.getName(), page, size);
    }

    @PatchMapping("/me")
    public ProfileResponse updateMe(Authentication auth, @Valid @RequestBody ProfileUpdateRequest req) {
        return service.updateMyProfile(auth.getName(), req);
    }

    @GetMapping("/me/social-links")
    public List<SocialLinkResponse> socialLinks(Authentication auth) {
        return service.mySocialLinks(auth.getName());
    }

    @PutMapping("/me/social-links")
    public List<SocialLinkResponse> updateSocialLinks(Authentication auth, @Valid @RequestBody List<@Valid SocialLinkRequest> req) {
        return service.updateMySocialLinks(auth.getName(), req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
        try {
            service.changeMyPassword(auth.getName(), req);
            return ResponseEntity.ok("Password changed");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(Authentication auth, @Valid @RequestBody DeleteAccountRequest req) {
        service.deleteMyAccount(auth.getName(), req);
        return ResponseEntity.noContent().build();
    }
}
