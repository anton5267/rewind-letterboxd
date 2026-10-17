package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
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

    public AdminModerationQueueService(ReviewRepository reviews, ReviewCommentRepository comments) {
        this.reviews = reviews;
        this.comments = comments;
    }

    @Transactional(readOnly = true)
    public Page<AdminModerationQueueItem> list(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        int fetchSize = Math.min(50, (safePage + 1) * safeSize);
        Pageable fetch = PageRequest.of(0, fetchSize);
        List<AdminModerationQueueItem> items = new ArrayList<>();
        reviews.findAllByModeratedAtIsNullOrderByCreatedAtAsc(fetch).map(this::reviewItem).forEach(items::add);
        comments.findAllByModeratedAtIsNullOrderByCreatedAtAsc(fetch).map(this::commentItem).forEach(items::add);
        items.sort(Comparator.comparing(AdminModerationQueueItem::createdAt));
        int from = Math.min(safePage * safeSize, items.size());
        int to = Math.min(from + safeSize, items.size());
        return new PageImpl<>(items.subList(from, to), PageRequest.of(safePage, safeSize),
                reviews.countByModeratedAtIsNull() + comments.countByModeratedAtIsNull());
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
