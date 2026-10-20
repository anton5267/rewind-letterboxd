package com.rewind.rewind.admin.dto;

import com.rewind.rewind.admin.audit.dto.AdminAuditLogResponse;

import java.util.List;

/**
 * Real, read-only aggregates used by the admin user-profile surface.
 * The values are calculated from the existing user activity tables; no UI-only
 * history or placeholder counters are created for the Figma composition.
 */
public record AdminUserOverviewResponse(
        Stats stats,
        List<AdminAuditLogResponse> adminHistory
) {
    public record Stats(
            long watched,
            long reviews,
            long ratings,
            long watchlist,
            long favorites,
            long comments,
            long likesReceived,
            long customLists
    ) {}
}
