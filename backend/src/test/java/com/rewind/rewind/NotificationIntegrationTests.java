package com.rewind.rewind;

import com.rewind.rewind.notification.entity.NotificationType;
import com.rewind.rewind.notification.entity.Notification;
import com.rewind.rewind.notification.repo.NotificationRepository;
import com.rewind.rewind.notification.service.NotificationService;
import com.rewind.rewind.social.service.FollowService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NotificationIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired FollowService follows;
    @Autowired NotificationService notifications;
    @Autowired NotificationRepository notificationRepository;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void createsFollowNotificationAndSupportsReadState() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String followerEmail = "notification-follower-" + suffix + "@example.invalid";
        String targetEmail = "notification-target-" + suffix + "@example.invalid";
        Long followerId = register("notification_follower_" + suffix, followerEmail);
        Long targetId = register("notification_target_" + suffix, targetEmail);

        follows.follow(followerEmail, targetId);
        follows.follow(followerEmail, targetId);

        var page = notifications.mine(targetEmail, 0, 20);
        assertEquals(1, page.getTotalElements());
        var notification = page.getContent().get(0);
        assertEquals(NotificationType.FOLLOW, notification.type());
        assertEquals(followerId, notification.actor().id());
        assertEquals(1, notifications.unreadCount(targetEmail));

        notifications.markRead(targetEmail, notification.id());
        assertEquals(0, notifications.unreadCount(targetEmail));

        follows.follow(followerEmail, targetId);
        notifications.markAllRead(targetEmail);
        assertEquals(0, notifications.unreadCount(targetEmail));

        assertTrue(notifications.preferences(targetEmail).followsEnabled());
        var updated = notifications.updatePreferences(targetEmail,
                new com.rewind.rewind.notification.dto.UpdateNotificationPreferencesRequest(false, true));
        assertFalse(updated.followsEnabled());
        assertTrue(updated.reviewLikesEnabled());
    }

    @Test
    @Transactional
    void notificationPagesAreStableWhenCreatedAtTies() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String targetEmail = "notification-pages-" + suffix + "@example.invalid";
        Long targetId = register("notification_pages_" + suffix, targetEmail);
        List<Notification> created = new ArrayList<>();
        for (int index = 0; index < 51; index++) {
            Notification notification = new Notification();
            notification.setRecipientId(targetId);
            notification.setType(NotificationType.FOLLOW);
            created.add(notification);
        }
        notificationRepository.saveAllAndFlush(created);
        jdbc.update("UPDATE notifications SET created_at = ? WHERE recipient_id = ?", Instant.parse("2030-01-01T00:00:00Z"), targetId);

        var firstPage = notifications.mine(targetEmail, 0, 50);
        var secondPage = notifications.mine(targetEmail, 1, 50);
        var ids = new HashSet<Long>();
        firstPage.forEach(item -> ids.add(item.id()));
        secondPage.forEach(item -> ids.add(item.id()));

        assertEquals(50, firstPage.getNumberOfElements());
        assertEquals(1, secondPage.getNumberOfElements());
        assertEquals(51, ids.size(), "Notification pages must not omit or repeat tied records");
    }

    private Long register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
        return userRepository.findByEmail(email).orElseThrow().getId();
    }
}
