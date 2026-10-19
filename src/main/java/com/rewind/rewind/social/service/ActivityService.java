package com.rewind.rewind.social.service;

import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.social.dto.ActivityResponse;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.entity.UserActivity;
import com.rewind.rewind.social.repo.FollowRepository;
import com.rewind.rewind.social.repo.UserActivityRepository;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ActivityService {
    private final UserActivityRepository activities;
    private final FollowRepository follows;
    private final UserRepository users;
    private final MovieRepository movies;
    private final MovieListRepository lists;

    public ActivityService(UserActivityRepository activities, FollowRepository follows, UserRepository users,
                           MovieRepository movies, MovieListRepository lists) {
        this.activities = activities;
        this.follows = follows;
        this.users = users;
        this.movies = movies;
        this.lists = lists;
    }

    @Transactional
    public void record(Long userId, ActivityType type, Long movieId, Long reviewId, Long listId, Long relatedUserId) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setType(type);
        activity.setMovieId(movieId);
        activity.setReviewId(reviewId);
        activity.setListId(listId);
        activity.setRelatedUserId(relatedUserId);
        activities.save(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> profile(Long userId, int page, int size) {
        users.findById(userId)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toResponses(activities.findAllByUserIdOrderByCreatedAtDescIdDesc(userId, pageRequest(page, size)));
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> following(String email, int page, int size) {
        User viewer = users.findByEmail(email).orElseThrow();
        List<Long> followedIds = follows.findAllByFollowerId(viewer.getId()).stream()
                .map(follow -> follow.getFollowing().getId()).toList();
        Pageable pageable = pageRequest(page, size);
        if (followedIds.isEmpty()) return Page.empty(pageable);
        return toResponses(activities.findAllByUserIdInOrderByCreatedAtDescIdDesc(followedIds, pageable));
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> recentWatched(int size) {
        return toResponses(activities.findRecentByTypeAndActiveUser(ActivityType.WATCHED, pageRequest(0, size)));
    }

    private Page<ActivityResponse> toResponses(Page<UserActivity> page) {
        Collection<Long> userIds = page.getContent().stream()
                .flatMap(activity -> java.util.stream.Stream.of(activity.getUserId(), activity.getRelatedUserId()))
                .filter(java.util.Objects::nonNull).toList();
        Map<Long, User> usersById = new HashMap<>();
        users.findAllById(userIds).stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .forEach(user -> usersById.put(user.getId(), user));
        Map<Long, Movie> moviesById = new HashMap<>();
        movies.findAllById(page.getContent().stream().map(activity -> activity.getMovieId()).filter(java.util.Objects::nonNull).toList())
                .forEach(movie -> moviesById.put(movie.getId(), movie));
        Map<Long, com.rewind.rewind.list.entity.MovieList> listsById = new HashMap<>();
        lists.findAllById(page.getContent().stream().map(activity -> activity.getListId()).filter(java.util.Objects::nonNull).toList())
                .stream()
                .filter(list -> Boolean.TRUE.equals(list.getIsPublic())
                        && list.getUser() != null
                        && Boolean.TRUE.equals(list.getUser().getIsActive()))
                .forEach(list -> listsById.put(list.getId(), list));
        List<ActivityResponse> content = page.getContent().stream().map(activity -> {
            User actor = usersById.get(activity.getUserId());
            User related = usersById.get(activity.getRelatedUserId());
            Movie movie = moviesById.get(activity.getMovieId());
            var list = listsById.get(activity.getListId());
            return new ActivityResponse(activity.getId(), activity.getType(), activity.getCreatedAt(),
                    actor == null ? null : new ActivityResponse.Actor(actor.getId(), actor.getUsername(), actor.getDisplayName(), actor.getAvatarUrl()),
                    movie == null ? null : new ActivityResponse.Movie(movie.getId(), movie.getTitle()),
                    related == null ? null : new ActivityResponse.RelatedUser(related.getId(), related.getUsername(), related.getDisplayName()),
                    list == null ? null : new ActivityResponse.ListInfo(list.getId(), list.getName()));
        }).toList();
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    private Pageable pageRequest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
    }
}
