package com.rewind.rewind.admin.settings.service;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.settings.dto.AdminSettingResponse;
import com.rewind.rewind.admin.settings.dto.AdminSettingUpdateRequest;
import com.rewind.rewind.admin.settings.entity.SiteSetting;
import com.rewind.rewind.admin.settings.repo.SiteSettingRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AdminSiteSettingsService {
    private static final Set<String> ALLOWED_KEYS = Set.of("site_name", "default_locale", "maintenance_mode", "journal_enabled");
    private final SiteSettingRepository settings;
    private final UserRepository users;
    private final AdminAuditLogService audit;

    public AdminSiteSettingsService(SiteSettingRepository settings, UserRepository users, AdminAuditLogService audit) {
        this.settings = settings;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AdminSettingResponse> list() {
        return settings.findAllById(ALLOWED_KEYS).stream().sorted((a, b) -> a.getKey().compareTo(b.getKey())).map(this::toResponse).toList();
    }

    @Transactional
    public AdminSettingResponse update(String key, AdminSettingUpdateRequest request, String adminEmail) {
        if (!ALLOWED_KEYS.contains(key)) throw new IllegalArgumentException("Unsupported site setting");
        String value = request.value().trim();
        validateValue(key, value);
        SiteSetting setting = settings.findById(key).orElseThrow(() -> new IllegalArgumentException("Site setting not found"));
        var admin = users.findByEmail(adminEmail).orElseThrow();
        setting.setValue(value);
        setting.setUpdatedBy(admin.getId());
        SiteSetting saved = settings.save(setting);
        audit.record(adminEmail, "SITE_SETTING_UPDATED", "SITE_SETTING", null, key);
        return toResponse(saved);
    }

    private void validateValue(String key, String value) {
        if ((key.equals("maintenance_mode") || key.equals("journal_enabled")) && !value.equalsIgnoreCase("true") && !value.equalsIgnoreCase("false")) {
            throw new IllegalArgumentException("Boolean site setting must be true or false");
        }
        if (key.equals("default_locale") && !Set.of("uk", "en").contains(value.toLowerCase())) {
            throw new IllegalArgumentException("Default locale must be uk or en");
        }
    }

    private AdminSettingResponse toResponse(SiteSetting setting) {
        return new AdminSettingResponse(setting.getKey(), setting.getValue(), setting.getUpdatedBy(), setting.getUpdatedAt());
    }
}
