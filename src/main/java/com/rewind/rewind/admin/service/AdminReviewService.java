package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminReviewResponse;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;

import java.time.Instant;

@Service
public class AdminReviewService {

    private final ReviewRepository reviews;
    private final UserRepository users;
    private final AdminAuditLogService audit;

    public AdminReviewService(ReviewRepository reviews, UserRepository users, AdminAuditLogService audit) {
        this.reviews = reviews;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<AdminReviewResponse> list(Long movieId, Long userId, Boolean hidden, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "id"));

        Page<Review> p;

        if (movieId != null && userId != null && hidden != null) {
            p = reviews.findAllByMovieIdAndUserIdAndIsHidden(movieId, userId, hidden, pageable);
        } else if (movieId != null && hidden != null) {
            p = reviews.findAllByMovieIdAndIsHidden(movieId, hidden, pageable);
        } else if (userId != null && hidden != null) {
            p = reviews.findAllByUserIdAndIsHidden(userId, hidden, pageable);
        } else if (hidden != null) {
            p = reviews.findAllByIsHidden(hidden, pageable);
        } else {
            p = reviews.findAll(pageable);
        }

        return p.map(this::toDto);
    }

    @Transactional
    public AdminReviewResponse hide(Long id, String adminEmail, String reason) {
        var admin = users.findByEmail(adminEmail).orElseThrow();
        Review r = reviews.findById(id).orElseThrow(() -> new IllegalArgumentException("Review not found"));

        r.setIsHidden(true);
        r.setModeratedReason(reason);
        r.setModeratedAt(Instant.now());
        r.setModeratedBy(admin);

        reviews.save(r);
        audit.record(adminEmail, "REVIEW_HIDDEN", "REVIEW", id, reason);
        return toDto(r);
    }

    @Transactional
    public AdminReviewResponse unhide(Long id, String adminEmail) {
        var admin = users.findByEmail(adminEmail).orElseThrow();
        Review r = reviews.findById(id).orElseThrow(() -> new IllegalArgumentException("Review not found"));

        r.setIsHidden(false);
        r.setModeratedReason(null);
        r.setModeratedAt(Instant.now());
        r.setModeratedBy(admin);

        reviews.save(r);
        audit.record(adminEmail, "REVIEW_UNHIDDEN", "REVIEW", id, null);
        return toDto(r);
    }

    @Transactional
    public void delete(Long id, String adminEmail) {
        if (!reviews.existsById(id)) throw new IllegalArgumentException("Review not found");
        reviews.deleteById(id);
        audit.record(adminEmail, "REVIEW_DELETED", "REVIEW", id, null);
    }

    private AdminReviewResponse toDto(Review r) {
        return new AdminReviewResponse(
                r.getId(),
                r.getMovie().getId(),
                r.getMovie().getTitle(),
                r.getUser().getId(),
                r.getUser().getUsername(),
                r.getContent(),
                r.getRating() == null ? null : r.getRating().intValue(),
                r.getIsHidden(),
                r.getModeratedReason(),
                r.getModeratedAt(),
                r.getCreatedAt()
        );
    }
}
