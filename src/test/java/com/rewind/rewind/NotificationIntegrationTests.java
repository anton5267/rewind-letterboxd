package com.rewind.rewind;

import com.rewind.rewind.notification.entity.NotificationType;
import com.rewind.rewind.notification.service.NotificationService;
import com.rewind.rewind.social.service.FollowService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NotificationIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired FollowService follows;
    @Autowired NotificationService notifications;

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
