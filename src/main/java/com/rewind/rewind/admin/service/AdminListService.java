package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.dto.AdminListResponse;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.repo.AdminListProjection;
import com.rewind.rewind.list.repo.MovieListRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminListService {
    private final MovieListRepository lists;
    private final AdminAuditLogService audit;

    public AdminListService(MovieListRepository lists, AdminAuditLogService audit) {
        this.lists = lists;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<AdminListResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "updatedAt"));
        return lists.findAdminRows(pageable).map(this::toDto);
    }

    @Transactional
    public AdminListResponse setVisibility(Long id, boolean visible, String adminEmail) {
        MovieList list = lists.findById(id).orElseThrow(() -> new IllegalArgumentException("List not found"));
        list.setIsPublic(visible);
        MovieList saved = lists.save(list);
        audit.record(adminEmail, visible ? "LIST_PUBLISHED" : "LIST_HIDDEN", "LIST", id, null);
        return lists.findAdminRowById(saved.getId()).map(this::toDto).orElseThrow();
    }

    private AdminListResponse toDto(AdminListProjection list) {
        return new AdminListResponse(
                list.getId(), list.getUserId(), list.getUsername(), list.getName(),
                list.getDescription(), list.getListType(), list.getIsPublic(), list.getItemCount(),
                list.getCreatedAt(), list.getUpdatedAt());
    }
}
