package com.rewind.rewind;

import com.rewind.rewind.message.dto.CreateConversationRequest;
import com.rewind.rewind.message.dto.SendMessageRequest;
import com.rewind.rewind.message.service.MessageService;
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
class MessageIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MessageService messages;

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
        assertThrows(IllegalArgumentException.class, () -> messages.messages(outsiderEmail, conversation.id(), 0, 20));
        messages.markRead(secondEmail, conversation.id());
        assertNotNull(messages.messages(secondEmail, conversation.id(), 0, 20).getContent().get(0).readAt());
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
