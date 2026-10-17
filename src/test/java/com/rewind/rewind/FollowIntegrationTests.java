package com.rewind.rewind;

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
class FollowIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired FollowService follows;

    @Test
    @Transactional
    void createsIdempotentFollowsAndExposesOnlyPublicNetworkData() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String followerEmail = "follower-" + suffix + "@example.invalid";
        String targetEmail = "target-" + suffix + "@example.invalid";
        Long followerId = register("follower_" + suffix, followerEmail);
        Long targetId = register("target_" + suffix, targetEmail);

        follows.follow(followerEmail, targetId);
        follows.follow(followerEmail, targetId);

        var status = follows.status(followerEmail, targetId);
        assertTrue(status.following());
        assertEquals(1, status.followers());
        assertEquals(0, status.followingCount());
        assertEquals(1, follows.followers(targetId, 0, 20).getTotalElements());
        assertEquals(followerId, follows.followers(targetId, 0, 20).getContent().get(0).id());
        assertEquals(1, follows.following(followerId, 0, 20).getTotalElements());
        assertEquals(targetId, follows.following(followerId, 0, 20).getContent().get(0).id());
        assertThrows(IllegalArgumentException.class, () -> follows.follow(followerEmail, followerId));

        follows.unfollow(followerEmail, targetId);
        assertFalse(follows.status(followerEmail, targetId).following());
        assertEquals(0, follows.followers(targetId, 0, 20).getTotalElements());
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
