package com.rewind.rewind.social.service;

import com.rewind.rewind.social.dto.PopularReviewerResponse;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PopularReviewerService {
    private final ReviewLikeRepository likes;
    private final UserRepository users;

    public PopularReviewerService(ReviewLikeRepository likes, UserRepository users) {
        this.likes = likes;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<PopularReviewerResponse> popular(int size) {
        var rows = likes.findPopularReviewers(PageRequest.of(0, Math.max(1, Math.min(size, 20))));
        Map<Long, User> byId = new HashMap<>();
        users.findAllById(rows.stream().map(ReviewLikeRepository.PopularReviewerRow::getUserId).toList())
                .forEach(user -> byId.put(user.getId(), user));
        return rows.stream().map(row -> {
            User user = byId.get(row.getUserId());
            return new PopularReviewerResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl(), row.getLikes());
        }).toList();
    }
}
