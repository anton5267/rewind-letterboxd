package com.rewind.rewind.social.service;

import com.rewind.rewind.social.dto.BlockStatusResponse;
import com.rewind.rewind.social.repo.FollowRepository;
import com.rewind.rewind.social.repo.UserBlockRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BlockService {
    private final UserBlockRepository blocks;
    private final UserRepository users;
    private final FollowRepository follows;

    public BlockService(UserBlockRepository blocks, UserRepository users, FollowRepository follows) {
        this.blocks = blocks;
        this.users = users;
        this.follows = follows;
    }

    @Transactional(readOnly = true)
    public BlockStatusResponse status(String email, Long targetId) {
        User current = users.findByEmail(email).orElseThrow();
        requireActiveTarget(targetId);
        return new BlockStatusResponse(isBlocked(current.getId(), targetId));
    }

    @Transactional
    public BlockStatusResponse block(String email, Long targetId) {
        User current = users.findByEmail(email).orElseThrow();
        User target = requireActiveTarget(targetId);
        if (current.getId().equals(target.getId())) throw new IllegalArgumentException("You cannot block yourself");
        blocks.insertIgnore(current.getId(), target.getId());
        follows.deleteByFollowerIdAndFollowingId(current.getId(), target.getId());
        follows.deleteByFollowerIdAndFollowingId(target.getId(), current.getId());
        return new BlockStatusResponse(true);
    }

    @Transactional
    public BlockStatusResponse unblock(String email, Long targetId) {
        User current = users.findByEmail(email).orElseThrow();
        requireActiveTarget(targetId);
        blocks.deleteByBlockerIdAndBlockedId(current.getId(), targetId);
        return new BlockStatusResponse(false);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(Long firstUserId, Long secondUserId) {
        return blocks.existsByBlockerIdAndBlockedId(firstUserId, secondUserId)
                || blocks.existsByBlockerIdAndBlockedId(secondUserId, firstUserId);
    }

    public void requireInteractionAllowed(Long firstUserId, Long secondUserId) {
        if (isBlocked(firstUserId, secondUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User interaction is blocked");
        }
    }

    private User requireActiveTarget(Long targetId) {
        return users.findById(targetId)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
