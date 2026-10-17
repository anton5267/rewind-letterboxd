package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminListResponse;
import com.rewind.rewind.admin.service.AdminListService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/admin/lists")
public class AdminListController {
    private final AdminListService service;

    public AdminListController(AdminListService service) { this.service = service; }

    @GetMapping
    public Page<AdminListResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    @PutMapping("/{id}/visibility")
    public AdminListResponse setVisibility(Authentication auth, @PathVariable Long id, @RequestParam boolean visible) {
        return service.setVisibility(id, visible, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
