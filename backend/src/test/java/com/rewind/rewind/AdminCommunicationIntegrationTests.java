package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminCommunicationService;
import com.rewind.rewind.admin.dto.AdminCreateNotificationRequest;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.message.entity.Conversation;
import com.rewind.rewind.message.entity.Message;
import com.rewind.rewind.message.repo.ConversationRepository;
import com.rewind.rewind.message.repo.MessageRepository;
import com.rewind.rewind.notification.entity.Notification;
import com.rewind.rewind.notification.entity.NotificationType;
import com.rewind.rewind.notification.repo.NotificationRepository;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;

@SpringBootTest
class AdminCommunicationIntegrationTests {
    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired ConversationRepository conversations;
    @Autowired MessageRepository messages;
    @Autowired NotificationRepository notifications;
    @Autowired AdminCommunicationService admin;
    @Autowired AdminAuditLogService audit;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void adminCanReadPagedCommunicationMetadata() {
        String suffix = String.valueOf(System.nanoTime());
        String firstEmail = "communication-one-" + suffix + "@example.invalid";
        String secondEmail = "communication-two-" + suffix + "@example.invalid";
        register("communication-one-" + suffix, firstEmail);
        register("communication-two-" + suffix, secondEmail);
        var first = users.findByEmail(firstEmail).orElseThrow();
        first.setRole(UserRole.ADMIN);
        Long firstId = first.getId();
        Long secondId = users.findByEmail(secondEmail).orElseThrow().getId();

        Conversation conversation = new Conversation();
        conversation.setUserOneId(firstId);
        conversation.setUserTwoId(secondId);
        conversations.saveAndFlush(conversation);
        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderId(firstId);
        message.setBody("moderation fixture");
        messages.saveAndFlush(message);

        Notification notification = new Notification();
        notification.setRecipientId(firstId);
        notification.setActorId(secondId);
        notification.setType(NotificationType.FOLLOW);
        notifications.saveAndFlush(notification);

        assertTrue(admin.conversations(0, 100).getContent().stream().anyMatch(row -> row.id().equals(conversation.getId())));
        assertTrue(admin.notifications(0, 100).getContent().stream().anyMatch(row -> row.id().equals(notification.getId())));

        var adminCreated = admin.createNotification(firstEmail,
                new AdminCreateNotificationRequest(firstId, NotificationType.REVIEW_LIKED, secondId, secondId, null));
        assertTrue(notifications.existsById(adminCreated.id()));
        assertTrue(audit.list(0, 100).getContent().stream().anyMatch(row -> row.targetId().equals(adminCreated.id()) && row.action().equals("NOTIFICATION_CREATED")));

        var read = admin.setNotificationRead(firstEmail, notification.getId(), true);
        assertNotNull(read.readAt());
        var unread = admin.setNotificationRead(firstEmail, notification.getId(), false);
        assertNull(unread.readAt());

        assertTrue(admin.notifications(NotificationType.FOLLOW, false, firstId, 0, 100).getContent().stream()
                .anyMatch(row -> row.id().equals(notification.getId())));
        assertTrue(admin.markNotificationsRead(firstEmail, NotificationType.FOLLOW, firstId) >= 1);
        assertTrue(admin.notifications(NotificationType.FOLLOW, true, firstId, 0, 100).getContent().stream()
                .anyMatch(row -> row.id().equals(notification.getId())));
        assertTrue(admin.deleteNotifications(firstEmail, NotificationType.FOLLOW, true, firstId) >= 1);
        assertFalse(notifications.existsById(notification.getId()));

        admin.deleteConversation(firstEmail, conversation.getId());
        assertFalse(conversations.existsById(conversation.getId()));
        assertFalse(messages.existsById(message.getId()));
        admin.deleteNotification(firstEmail, adminCreated.id());
        assertFalse(notifications.existsById(adminCreated.id()));
    }

    @Test
    @Transactional
    void notificationPagesAreStableWhenCreatedAtTies() {
        String suffix = String.valueOf(System.nanoTime());
        String recipientEmail = "notification-pages-" + suffix + "@example.invalid";
        register("notification-pages-" + suffix, recipientEmail);
        Long recipientId = users.findByEmail(recipientEmail).orElseThrow().getId();

        var created = new ArrayList<Notification>();
        for (int index = 0; index < 51; index++) {
            Notification notification = new Notification();
            notification.setRecipientId(recipientId);
            notification.setType(NotificationType.FOLLOW);
            created.add(notification);
        }
        notifications.saveAllAndFlush(created);
        Instant tiedAt = Instant.parse("2026-10-17T00:00:00Z");
        for (Notification notification : created) {
            jdbc.update("update notifications set created_at = ? where id = ?", Timestamp.from(tiedAt), notification.getId());
        }

        var expectedIds = new HashSet<Long>();
        created.forEach(notification -> expectedIds.add(notification.getId()));
        var firstPage = admin.notifications(NotificationType.FOLLOW, false, recipientId, 0, 50);
        var secondPage = admin.notifications(NotificationType.FOLLOW, false, recipientId, 1, 50);
        var actualIds = new HashSet<Long>();
        firstPage.forEach(item -> actualIds.add(item.id()));
        secondPage.forEach(item -> actualIds.add(item.id()));

        assertEquals(51, firstPage.getTotalElements());
        assertEquals(50, firstPage.getNumberOfElements());
        assertEquals(1, secondPage.getNumberOfElements());
        assertEquals(expectedIds, actualIds, "Notification pages must neither omit nor repeat equal-timestamp rows");
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        userService.register(request);
    }
}
