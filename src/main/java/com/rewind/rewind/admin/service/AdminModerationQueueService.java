package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
import com.rewind.rewind.admin.dto.AdminModerationTarget;
import com.rewind.rewind.admin.repo.AdminModerationQueueRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class AdminModerationQueueService {
    private final AdminModerationQueueRepository queue;
    private final AdminReviewService reviewModeration;
    private final AdminCommentService commentModeration;

    public AdminModerationQueueService(AdminModerationQueueRepository queue,
                                       AdminReviewService reviewModeration, AdminCommentService commentModeration) {
        this.queue = queue;
        this.reviewModeration = reviewModeration;
        this.commentModeration = commentModeration;
    }

    @Transactional
    public void hide(String type, Long id, String adminEmail, String reason) {
        if ("REVIEW".equalsIgnoreCase(type)) {
            reviewModeration.hide(id, adminEmail, reason);
            return;
        }
        if ("COMMENT".equalsIgnoreCase(type)) {
            commentModeration.hide(id, adminEmail, reason);
            return;
        }
        throw new IllegalArgumentException("Unsupported moderation item type");
    }

    @Transactional
    public int hideBulk(List<AdminModerationTarget> targets, String adminEmail, String reason) {
        if (targets == null || targets.isEmpty() || targets.size() > 50) {
            throw new IllegalArgumentException("Bulk moderation supports 1 to 50 items");
        }
        targets.forEach(target -> hide(target.type(), target.id(), adminEmail, reason));
        return targets.size();
    }

    @Transactional(readOnly = true)
    public Page<AdminModerationQueueItem> list(int page, int size) {
        return list(null, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<AdminModerationQueueItem> list(String type, String query, int page, int size) {
        String normalizedType = type == null || type.isBlank() ? null : type.trim().toUpperCase(Locale.ROOT);
        if (normalizedType != null && !normalizedType.equals("REVIEW") && !normalizedType.equals("COMMENT")) {
            throw new IllegalArgumentException("Unsupported moderation item type");
        }
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        return queue.findQueue(normalizedType, normalizedQuery, PageRequest.of(safePage, safeSize));
    }
}
