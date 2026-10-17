package com.rewind.rewind.admin.audit.dto;

import java.time.Instant;

public record AdminAuditLogResponse(Long id, Long adminId, String action, String targetType, Long targetId, String metadata, Instant createdAt) {}
