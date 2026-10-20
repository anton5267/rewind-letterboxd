package com.rewind.rewind;

import com.rewind.rewind.social.service.FollowService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
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

    @Test
    @Transactional
    void paginatesNetworkWithStableIdTieBreak() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String targetEmail = "network-target-" + suffix + "@example.invalid";
        Long targetId = register("network_target_" + suffix, targetEmail);

        for (int index = 0; index < 17; index++) {
            String email = "network-follower-" + suffix + "-" + index + "@example.invalid";
            Long followerId = register("network_follower_" + suffix + "_" + index, email);
            follows.follow(email, targetId);
            assertNotNull(followerId);
        }

        var first = follows.followers(targetId, 0, 8);
        var second = follows.followers(targetId, 1, 8);
        var third = follows.followers(targetId, 2, 8);
        var ids = new HashSet<Long>();
        first.getContent().forEach(user -> ids.add(user.id()));
        second.getContent().forEach(user -> ids.add(user.id()));
        third.getContent().forEach(user -> ids.add(user.id()));

        assertEquals(17, first.getTotalElements());
        assertEquals(8, first.getContent().size());
        assertEquals(8, second.getContent().size());
        assertEquals(1, third.getContent().size());
        assertEquals(17, ids.size());
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
