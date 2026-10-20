package com.rewind.rewind;

import com.rewind.rewind.message.service.MessageService;
import com.rewind.rewind.social.service.BlockService;
import com.rewind.rewind.social.service.FollowService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BlockingIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired BlockService blocks;
    @Autowired FollowService follows;
    @Autowired MessageService messages;

    @Test
    @Transactional
    void blockRemovesFollowAndStopsFollowAndMessageInteractionsUntilUnblocked() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String blockerEmail = "blocker-" + suffix + "@example.invalid";
        String targetEmail = "blocked-" + suffix + "@example.invalid";
        Long blockerId = register("blocker_" + suffix, blockerEmail);
        Long targetId = register("blocked_" + suffix, targetEmail);

        follows.follow(blockerEmail, targetId);
        var conversation = messages.start(blockerEmail, targetId);
        assertTrue(follows.status(blockerEmail, targetId).following());

        assertTrue(blocks.block(blockerEmail, targetId).blocked());
        assertTrue(blocks.status(blockerEmail, targetId).blocked());
        assertFalse(follows.status(blockerEmail, targetId).following());
        assertTrue(messages.mine(blockerEmail, 0, 20).isEmpty());
        assertTrue(messages.mine(targetEmail, 0, 20).isEmpty());
        assertThrows(ResponseStatusException.class, () -> follows.follow(blockerEmail, targetId));
        assertThrows(ResponseStatusException.class, () -> follows.follow(targetEmail, blockerId));
        assertThrows(ResponseStatusException.class, () -> messages.start(targetEmail, blockerId));
        assertThrows(ResponseStatusException.class, () -> messages.messages(targetEmail, conversation.id(), 0, 20));

        assertFalse(blocks.unblock(blockerEmail, targetId).blocked());
        assertEquals(1, messages.mine(blockerEmail, 0, 20).getTotalElements());
        follows.follow(targetEmail, blockerId);
        assertTrue(follows.status(targetEmail, blockerId).following());
        assertEquals(conversation.id(), messages.start(targetEmail, blockerId).id());
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
