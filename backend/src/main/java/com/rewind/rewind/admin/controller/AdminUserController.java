package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminUpdateUserRequest;
import com.rewind.rewind.admin.dto.AdminUserResponse;
import com.rewind.rewind.admin.dto.AdminUserOverviewResponse;
import com.rewind.rewind.admin.dto.AdminHqRequest;
import com.rewind.rewind.admin.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public Page<AdminUserResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(q, page, size);
    }

    @GetMapping("/{id}")
    public AdminUserResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/overview")
    public AdminUserOverviewResponse overview(@PathVariable Long id) {
        return service.overview(id);
    }

    @PatchMapping("/{id}")
    public AdminUserResponse update(Authentication auth, @PathVariable Long id, @Valid @RequestBody AdminUpdateUserRequest req) {
        return service.update(id, req, auth.getName());
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(Authentication auth, @PathVariable Long id) {
        service.deactivate(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(Authentication auth, @PathVariable Long id) {
        service.activate(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/hq")
    public AdminUserResponse setHq(Authentication auth, @PathVariable Long id, @Valid @RequestBody AdminHqRequest request) {
        return service.setHq(id, request.hq(), auth.getName());
    }
}
