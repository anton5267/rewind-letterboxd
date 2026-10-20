package com.rewind.rewind;

import com.rewind.rewind.message.dto.SendMessageRequest;
import com.rewind.rewind.message.entity.Message;
import com.rewind.rewind.message.repo.MessageRepository;
import com.rewind.rewind.message.service.MessageService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MessageIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MessageService messages;
    @Autowired MessageRepository messageRepository;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void directConversationProtectsMembershipAndKeepsMessagesOrdered() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String firstEmail = "message-first-" + suffix + "@example.invalid";
        String secondEmail = "message-second-" + suffix + "@example.invalid";
        String outsiderEmail = "message-outsider-" + suffix + "@example.invalid";
        register("message_first_" + suffix, firstEmail);
        Long secondId = register("message_second_" + suffix, secondEmail);
        register("message_outsider_" + suffix, outsiderEmail);

        var conversation = messages.start(firstEmail, secondId);
        assertEquals(conversation.id(), messages.start(secondEmail, userRepository.findByEmail(firstEmail).orElseThrow().getId()).id());
        var sent = messages.send(firstEmail, conversation.id(), new SendMessageRequest("  Hello from Rewind  "));
        assertEquals("Hello from Rewind", sent.body());
        assertEquals(1, messages.messages(secondEmail, conversation.id(), 0, 20).getTotalElements());
        assertEquals(1, messages.unreadCount(secondEmail));
        assertEquals(0, messages.unreadCount(firstEmail));
        ResponseStatusException notFound = assertThrows(ResponseStatusException.class,
                () -> messages.messages(outsiderEmail, conversation.id(), 0, 20));
        assertEquals(HttpStatus.NOT_FOUND, notFound.getStatusCode());
        assertEquals("Conversation not found", notFound.getReason());
        messages.markRead(secondEmail, conversation.id());
        assertEquals(0, messages.unreadCount(secondEmail));
        assertNotNull(messages.messages(secondEmail, conversation.id(), 0, 20).getContent().get(0).readAt());
    }

    @Test
    @Transactional
    void messagePagesAreStableAndMarkReadUpdatesMoreThanOneHundredRows() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String firstEmail = "message-pages-first-" + suffix + "@example.invalid";
        String secondEmail = "message-pages-second-" + suffix + "@example.invalid";
        Long firstId = register("message_pages_first_" + suffix, firstEmail);
        Long secondId = register("message_pages_second_" + suffix, secondEmail);
        var conversation = messages.start(firstEmail, secondId);

        List<Message> created = new ArrayList<>();
        for (int index = 0; index < 101; index++) {
            Message message = new Message();
            message.setConversationId(conversation.id());
            message.setSenderId(firstId);
            message.setBody("fixture message " + index);
            created.add(message);
        }
        messageRepository.saveAllAndFlush(created);
        jdbc.update("UPDATE messages SET created_at = ? WHERE conversation_id = ?", Instant.parse("2030-01-01T00:00:00Z"), conversation.id());

        var firstPage = messages.messages(secondEmail, conversation.id(), 0, 50);
        var secondPage = messages.messages(secondEmail, conversation.id(), 1, 50);
        var thirdPage = messages.messages(secondEmail, conversation.id(), 2, 50);
        var ids = new HashSet<Long>();
        firstPage.forEach(item -> ids.add(item.id()));
        secondPage.forEach(item -> ids.add(item.id()));
        thirdPage.forEach(item -> ids.add(item.id()));

        assertEquals(50, firstPage.getNumberOfElements());
        assertEquals(50, secondPage.getNumberOfElements());
        assertEquals(1, thirdPage.getNumberOfElements());
        assertEquals(101, ids.size(), "Message pages must not omit or repeat tied records");

        messages.markRead(secondEmail, conversation.id());
        Integer unread = jdbc.queryForObject(
                "SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL",
                Integer.class, conversation.id(), secondId);
        assertEquals(0, unread);
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
