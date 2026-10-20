package com.rewind.rewind.admin.settings.controller;

import com.rewind.rewind.admin.settings.dto.AdminSettingResponse;
import com.rewind.rewind.admin.settings.dto.AdminSettingUpdateRequest;
import com.rewind.rewind.admin.settings.service.AdminSiteSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSiteSettingsController {
    private final AdminSiteSettingsService settings;

    public AdminSiteSettingsController(AdminSiteSettingsService settings) { this.settings = settings; }

    @GetMapping
    public List<AdminSettingResponse> list() { return settings.list(); }

    @PutMapping("/{key}")
    public AdminSettingResponse update(Authentication auth, @PathVariable String key, @Valid @RequestBody AdminSettingUpdateRequest request) {
        return settings.update(key, request, auth.getName());
    }
}
