package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.dto.AdminCommentResponse;
import com.rewind.rewind.comment.entity.ReviewComment;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCommentService {
    private final ReviewCommentRepository comments;
    private final UserRepository users;
    private final AdminAuditLogService audit;

    public AdminCommentService(ReviewCommentRepository comments, UserRepository users, AdminAuditLogService audit) {
        this.comments = comments;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<AdminCommentResponse> list(Boolean hidden, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "id"));
        Page<ReviewComment> result = hidden == null ? comments.findAllByOrderByIdDesc(pageable) : comments.findAllByIsHidden(hidden, pageable);
        return result.map(this::toDto);
    }

    @Transactional
    public AdminCommentResponse hide(Long id, String adminEmail, String reason) {
        ReviewComment comment = comments.findById(id).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        comment.setIsHidden(true);
        comment.setModeratedReason(reason);
        comment.setModeratedAt(java.time.Instant.now());
        comment.setModeratedBy(users.findByEmail(adminEmail).orElseThrow());
        comments.save(comment);
        audit.record(adminEmail, "COMMENT_HIDDEN", "COMMENT", id, reason);
        return toDto(comment);
    }

    @Transactional
    public AdminCommentResponse unhide(Long id, String adminEmail) {
        ReviewComment comment = comments.findById(id).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        comment.setIsHidden(false);
        comment.setModeratedReason(null);
        comment.setModeratedAt(java.time.Instant.now());
        comment.setModeratedBy(users.findByEmail(adminEmail).orElseThrow());
        comments.save(comment);
        audit.record(adminEmail, "COMMENT_UNHIDDEN", "COMMENT", id, null);
        return toDto(comment);
    }

    @Transactional
    public void delete(Long id, String adminEmail) {
        if (!comments.existsById(id)) throw new IllegalArgumentException("Comment not found");
        comments.deleteById(id);
        audit.record(adminEmail, "COMMENT_DELETED", "COMMENT", id, null);
    }

    private AdminCommentResponse toDto(ReviewComment comment) {
        return new AdminCommentResponse(comment.getId(), comment.getReview().getId(), comment.getUser().getId(),
                comment.getUser().getUsername(), comment.getContent(), comment.getIsHidden(), comment.getModeratedReason(),
                comment.getModeratedAt(), comment.getCreatedAt());
    }
}
