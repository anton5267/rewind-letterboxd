package com.rewind.rewind.list.repo;

import com.rewind.rewind.list.entity.ListType;

import java.time.Instant;

public interface AdminListProjection {
    Long getId();
    Long getUserId();
    String getUsername();
    String getName();
    String getDescription();
    ListType getListType();
    Boolean getIsPublic();
    long getItemCount();
    Instant getCreatedAt();
    Instant getUpdatedAt();
}
