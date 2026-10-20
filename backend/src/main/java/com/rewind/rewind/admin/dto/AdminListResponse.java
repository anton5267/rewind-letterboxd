package com.rewind.rewind.admin.dto;

import com.rewind.rewind.list.entity.ListType;

import java.time.Instant;

public record AdminListResponse(
        Long id,
        Long userId,
        String username,
        String name,
        String description,
        ListType listType,
        Boolean isPublic,
        long itemCount,
        Instant createdAt,
        Instant updatedAt
) {}
