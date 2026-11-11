package com.rewind.rewind;

import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.comment.repo.ReviewCommentRepository;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.social.repo.FollowRepository;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminUserOverviewTests {

    @Test
    void overviewIncludesActiveFollowerCount() {
        Long userId = 42L;
        User target = new User();
        UserRepository users = mock(UserRepository.class);
        AdminAuditLogService audit = mock(AdminAuditLogService.class);
        MovieListRepository lists = mock(MovieListRepository.class);
        ListItemRepository listItems = mock(ListItemRepository.class);
        RatingRepository ratings = mock(RatingRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        ReviewCommentRepository comments = mock(ReviewCommentRepository.class);
        ReviewLikeRepository reviewLikes = mock(ReviewLikeRepository.class);
        FollowRepository follows = mock(FollowRepository.class);

        when(users.findById(userId)).thenReturn(Optional.of(target));
        when(lists.findAllByUser(target)).thenReturn(List.of());
        when(follows.countActiveFollowers(userId)).thenReturn(7L);
        when(audit.recentForTarget("USER", userId, 12)).thenReturn(List.of());

        AdminUserService service = new AdminUserService(users, audit, lists, listItems, ratings, reviews,
                comments, reviewLikes, follows);

        var overview = service.overview(userId);

        assertEquals(7L, overview.stats().followers());
        verify(follows).countActiveFollowers(userId);
    }
}
