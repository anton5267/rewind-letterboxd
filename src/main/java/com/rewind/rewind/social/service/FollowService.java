package com.rewind.rewind.social.service;

import com.rewind.rewind.social.dto.FollowStatusResponse;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.entity.Follow;
import com.rewind.rewind.social.repo.FollowRepository;
import com.rewind.rewind.notification.service.NotificationService;
import com.rewind.rewind.user.dto.PublicUserResponse;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FollowService {
    private final FollowRepository follows;
    private final UserRepository users;
    private final ActivityService activities;
    private final NotificationService notifications;

    public FollowService(FollowRepository follows, UserRepository users, ActivityService activities, NotificationService notifications) {
        this.follows = follows;
        this.users = users;
        this.activities = activities;
        this.notifications = notifications;
    }

    @Transactional
    public void follow(String email, Long targetId) {
        User follower = users.findByEmail(email).orElseThrow();
        User target = users.findById(targetId).orElseThrow();
        if (follower.getId().equals(targetId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }
        if (follows.existsByFollowerIdAndFollowingId(follower.getId(), targetId)) {
            return;
        }
        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(target);
        follows.save(follow);
        activities.record(follower.getId(), ActivityType.FOLLOW, null, null, null, targetId);
        notifications.follow(target, follower);
    }

    @Transactional
    public void unfollow(String email, Long targetId) {
        User follower = users.findByEmail(email).orElseThrow();
        follows.deleteByFollowerIdAndFollowingId(follower.getId(), targetId);
    }

    @Transactional(readOnly = true)
    public FollowStatusResponse status(String email, Long targetId) {
        User follower = users.findByEmail(email).orElseThrow();
        users.findById(targetId).orElseThrow();
        return new FollowStatusResponse(
                follows.existsByFollowerIdAndFollowingId(follower.getId(), targetId),
                follows.countByFollowingId(targetId),
                follows.countByFollowerId(targetId));
    }

    @Transactional(readOnly = true)
    public Page<PublicUserResponse> followers(Long userId, int page, int size) {
        users.findById(userId).orElseThrow();
        return follows.findAllByFollowingIdOrderByCreatedAtDesc(userId, pageRequest(page, size))
                .map(follow -> publicUser(follow.getFollower()));
    }

    @Transactional(readOnly = true)
    public Page<PublicUserResponse> following(Long userId, int page, int size) {
        users.findById(userId).orElseThrow();
        return follows.findAllByFollowerIdOrderByCreatedAtDesc(userId, pageRequest(page, size))
                .map(follow -> publicUser(follow.getFollowing()));
    }

    private Pageable pageRequest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
    }

    private PublicUserResponse publicUser(User user) {
        return new PublicUserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl());
    }
}
