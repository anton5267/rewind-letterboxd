package com.rewind.rewind.profile.controller;

import com.rewind.rewind.profile.dto.FavoriteMoveRequest;
import com.rewind.rewind.profile.service.FavoriteOrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileFavoriteOrderController {
    private final FavoriteOrderService service;

    public ProfileFavoriteOrderController(FavoriteOrderService service) {
        this.service = service;
    }

    @PutMapping("/api/profile/me/favorites/order")
    public ResponseEntity<Void> move(Authentication auth, @Valid @RequestBody FavoriteMoveRequest request) {
        service.move(auth.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
