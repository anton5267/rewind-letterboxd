package com.rewind.rewind.social.service;

import com.rewind.rewind.social.dto.PopularReviewerResponse;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.review.repo.ReviewRepository;
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
    private final ReviewRepository reviews;
    private final MovieListRepository lists;
    private final ListItemRepository listItems;

    public PopularReviewerService(ReviewLikeRepository likes, UserRepository users, ReviewRepository reviews,
                                  MovieListRepository lists, ListItemRepository listItems) {
        this.likes = likes;
        this.users = users;
        this.reviews = reviews;
        this.lists = lists;
        this.listItems = listItems;
    }

    @Transactional(readOnly = true)
    public List<PopularReviewerResponse> popular(int size) {
        var rows = likes.findPopularReviewers(PageRequest.of(0, Math.max(1, Math.min(size, 20))));
        Map<Long, User> byId = new HashMap<>();
        users.findAllById(rows.stream().map(row -> row.getUserId()).toList())
                .stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .forEach(user -> byId.put(user.getId(), user));
        var userIds = new java.util.ArrayList<>(byId.keySet());
        Map<Long, Long> reviewCounts = countsByUserId(reviews.countVisibleByUserIds(userIds));
        Map<Long, Long> watchedCounts = countsByUserId(listItems.countByUserIdsAndListType(userIds, ListType.WATCHED));
        Map<Long, Long> listCounts = countsByUserId(lists.countByUserIdsAndListType(userIds, ListType.CUSTOM));
        return rows.stream().map(row -> {
            User user = byId.get(row.getUserId());
            if (user == null) return null;
            return new PopularReviewerResponse(
                    user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl(), row.getLikes(),
                    reviewCounts.getOrDefault(user.getId(), 0L), watchedCounts.getOrDefault(user.getId(), 0L),
                    listCounts.getOrDefault(user.getId(), 0L));
        }).filter(value -> value != null).toList();
    }

    private Map<Long, Long> countsByUserId(List<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        rows.forEach(row -> counts.put((Long) row[0], (Long) row[1]));
        return counts;
    }
}
