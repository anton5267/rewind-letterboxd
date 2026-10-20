package com.rewind.rewind.admin.settings.dto;

import java.time.Instant;

public record AdminSettingResponse(String key, String value, Long updatedBy, Instant updatedAt) {}
