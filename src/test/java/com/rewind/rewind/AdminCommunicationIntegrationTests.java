package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminCommunicationService;
import com.rewind.rewind.message.entity.Conversation;
import com.rewind.rewind.message.repo.ConversationRepository;
import com.rewind.rewind.notification.entity.Notification;
import com.rewind.rewind.notification.entity.NotificationType;
import com.rewind.rewind.notification.repo.NotificationRepository;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AdminCommunicationIntegrationTests {
    @Autowired UserService userService;
    @Autowired UserRepository users;
    @Autowired ConversationRepository conversations;
    @Autowired NotificationRepository notifications;
    @Autowired AdminCommunicationService admin;

    @Test
    @Transactional
    void adminCanReadPagedCommunicationMetadata() {
        String suffix = String.valueOf(System.nanoTime());
        String firstEmail = "communication-one-" + suffix + "@example.invalid";
        String secondEmail = "communication-two-" + suffix + "@example.invalid";
        register("communication-one-" + suffix, firstEmail);
        register("communication-two-" + suffix, secondEmail);
        Long firstId = users.findByEmail(firstEmail).orElseThrow().getId();
        Long secondId = users.findByEmail(secondEmail).orElseThrow().getId();

        Conversation conversation = new Conversation();
        conversation.setUserOneId(firstId);
        conversation.setUserTwoId(secondId);
        conversations.saveAndFlush(conversation);

        Notification notification = new Notification();
        notification.setRecipientId(firstId);
        notification.setActorId(secondId);
        notification.setType(NotificationType.FOLLOW);
        notifications.saveAndFlush(notification);

        assertTrue(admin.conversations(0, 100).getContent().stream().anyMatch(row -> row.id().equals(conversation.getId())));
        assertTrue(admin.notifications(0, 100).getContent().stream().anyMatch(row -> row.id().equals(notification.getId())));
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        userService.register(request);
    }
}
