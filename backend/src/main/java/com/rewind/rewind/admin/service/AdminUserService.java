package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminUpdateUserRequest;
import com.rewind.rewind.admin.dto.AdminUserResponse;
import com.rewind.rewind.admin.dto.AdminUserOverviewResponse;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;

import java.util.List;
import java.util.Locale;

@Service
public class AdminUserService {

    private final UserRepository users;
    private final AdminAuditLogService audit;
    private final MovieListRepository lists;
    private final ListItemRepository listItems;
    private final RatingRepository ratings;
    private final ReviewRepository reviews;
    private final ReviewCommentRepository comments;
    private final ReviewLikeRepository reviewLikes;

    public AdminUserService(UserRepository users, AdminAuditLogService audit, MovieListRepository lists,
                            ListItemRepository listItems, RatingRepository ratings, ReviewRepository reviews,
                            ReviewCommentRepository comments, ReviewLikeRepository reviewLikes) {
        this.users = users;
        this.audit = audit;
        this.lists = lists;
        this.listItems = listItems;
        this.ratings = ratings;
        this.reviews = reviews;
        this.comments = comments;
        this.reviewLikes = reviewLikes;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> list(String q, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "id"));
        String query = q == null ? null : q.trim();

        Page<User> p;
        if (query == null || query.isBlank()) {
            p = users.findAll(pageable);
        } else {
            p = users.findAllByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                    query, query, query, pageable
            );
        }

        return p.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse get(Long id) {
        return toDto(users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found")));
    }

    @Transactional(readOnly = true)
    public AdminUserOverviewResponse overview(Long id) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<MovieList> allLists = lists.findAllByUser(user);
        var stats = new AdminUserOverviewResponse.Stats(
                collectionCount(allLists, ListType.WATCHED),
                reviews.countByUserIdAndIsHiddenFalse(id),
                ratings.countByUserId(id),
                collectionCount(allLists, ListType.WATCHLIST),
                collectionCount(allLists, ListType.FAVORITES),
                comments.countByUserId(id),
                reviewLikes.countActiveReceivedByReviewAuthorId(id),
                allLists.stream().filter(list -> list.getListType() == ListType.CUSTOM).count());
        return new AdminUserOverviewResponse(stats, audit.recentForTarget("USER", id, 12));
    }

    @Transactional
    public AdminUserResponse update(Long id, AdminUpdateUserRequest req) {
        return update(id, req, null);
    }

    @Transactional
    public AdminUserResponse update(Long id, AdminUpdateUserRequest req, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String requestedRole = normalizeRole(req.getRole());
        guardAdminAccountChange(u, req.getIsActive(), requestedRole, adminEmail);

        if (req.getUsername() != null) u.setUsername(req.getUsername().trim());
        if (req.getDisplayName() != null) u.setDisplayName(blankToNull(req.getDisplayName()));
        if (req.getAvatarUrl() != null) u.setAvatarUrl(blankToNull(req.getAvatarUrl()));
        if (req.getIsActive() != null) u.setIsActive(req.getIsActive());

        if (requestedRole != null) {
            try {
                u.setRole(UserRole.valueOf(requestedRole));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid role. Use USER or ADMIN");
            }
        }

        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_UPDATED", "USER", id, null);
        return toDto(u);
    }

    private String normalizeRole(String role) {
        return role == null ? null : role.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    @Transactional
    public void deactivate(Long id) {
        deactivate(id, null);
    }

    @Transactional
    public void deactivate(Long id, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        guardAdminAccountChange(u, false, null, adminEmail);
        u.setIsActive(false);
        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_DEACTIVATED", "USER", id, null);
    }

    @Transactional
    public void activate(Long id) {
        activate(id, null);
    }

    @Transactional
    public void activate(Long id, String adminEmail) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setIsActive(true);
        users.save(u);
        if (adminEmail != null) audit.record(adminEmail, "USER_ACTIVATED", "USER", id, null);
    }

    private AdminUserResponse toDto(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getUsername(),
                u.getDisplayName(),
                u.getEmail(),
                u.getRole().name(),
                u.getAvatarUrl(),
                u.getIsActive(),
                u.getIsHq(),
                u.getCreatedAt()
        );
    }

    private long collectionCount(List<MovieList> allLists, ListType type) {
        return allLists.stream()
                .filter(list -> list.getListType() == type)
                .findFirst()
                .map(list -> listItems.countByListId(list.getId()))
                .orElse(0L);
    }

    private void guardAdminAccountChange(User target, Boolean requestedActive, String requestedRole, String adminEmail) {
        boolean self = adminEmail != null && adminEmail.equalsIgnoreCase(target.getEmail());
        boolean deactivating = Boolean.FALSE.equals(requestedActive);
        boolean demoting = requestedRole != null && UserRole.USER.name().equalsIgnoreCase(requestedRole.trim());
        if (self && (deactivating || demoting)) {
            throw new IllegalArgumentException("Administrators cannot deactivate or demote their own account");
        }
        boolean removingAdminPrivileges = target.getRole() == UserRole.ADMIN && (deactivating || demoting);
        if (Boolean.TRUE.equals(target.getIsActive())
                && removingAdminPrivileges
                && users.findAllByRoleAndIsActiveTrue(UserRole.ADMIN).size() <= 1) {
            throw new IllegalArgumentException("At least one active administrator is required");
        }
    }

    @Transactional
    public AdminUserResponse setHq(Long id, boolean hq) { return setHq(id, hq, null); }

    @Transactional
    public AdminUserResponse setHq(Long id, boolean hq, String adminEmail) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setIsHq(hq);
        users.save(user);
        if (adminEmail != null) audit.record(adminEmail, hq ? "HQ_GRANTED" : "HQ_REVOKED", "USER", id, null);
        return toDto(user);
    }
}
