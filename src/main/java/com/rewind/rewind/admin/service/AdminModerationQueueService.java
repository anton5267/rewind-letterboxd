package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
import com.rewind.rewind.admin.dto.AdminModerationTarget;
import com.rewind.rewind.comment.entity.ReviewComment;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AdminModerationQueueService {
    private final ReviewRepository reviews;
    private final ReviewCommentRepository comments;
    private final AdminReviewService reviewModeration;
    private final AdminCommentService commentModeration;

    public AdminModerationQueueService(ReviewRepository reviews, ReviewCommentRepository comments,
                                       AdminReviewService reviewModeration, AdminCommentService commentModeration) {
        this.reviews = reviews;
        this.comments = comments;
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
        String normalizedType = type == null || type.isBlank() ? null : type.trim().toUpperCase();
        if (normalizedType != null && !normalizedType.equals("REVIEW") && !normalizedType.equals("COMMENT")) {
            throw new IllegalArgumentException("Unsupported moderation item type");
        }
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        int fetchSize = Math.min(250, (safePage + 1) * safeSize);
        Pageable fetch = PageRequest.of(0, fetchSize);
        List<AdminModerationQueueItem> items = new ArrayList<>();
        long total;
        if (normalizedType == null || normalizedType.equals("REVIEW")) {
            reviews.findModerationQueue(normalizedQuery, fetch).map(this::reviewItem).forEach(items::add);
        }
        if (normalizedType == null || normalizedType.equals("COMMENT")) {
            comments.findModerationQueue(normalizedQuery, fetch).map(this::commentItem).forEach(items::add);
        }
        if (normalizedType == null) {
            total = reviews.countModerationQueue(normalizedQuery) + comments.countModerationQueue(normalizedQuery);
        } else if (normalizedType.equals("REVIEW")) {
            total = reviews.countModerationQueue(normalizedQuery);
        } else {
            total = comments.countModerationQueue(normalizedQuery);
        }
        items.sort(Comparator.comparing((AdminModerationQueueItem item) -> item.createdAt()));
        int from = Math.min(safePage * safeSize, items.size());
        int to = Math.min(from + safeSize, items.size());
        return new PageImpl<>(items.subList(from, to), PageRequest.of(safePage, safeSize),
                total);
    }

    private AdminModerationQueueItem reviewItem(Review review) {
        return new AdminModerationQueueItem("REVIEW", review.getId(), null, review.getMovie().getId(),
                review.getMovie().getTitle(), review.getUser().getId(), review.getUser().getUsername(),
                review.getContent(), review.getCreatedAt());
    }

    private AdminModerationQueueItem commentItem(ReviewComment comment) {
        return new AdminModerationQueueItem("COMMENT", comment.getId(), comment.getReview().getId(), null,
                "Review #" + comment.getReview().getId(), comment.getUser().getId(), comment.getUser().getUsername(),
                comment.getContent(), comment.getCreatedAt());
    }
}
