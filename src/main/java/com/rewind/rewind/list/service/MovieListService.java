package com.rewind.rewind.list.service;

import com.rewind.rewind.list.dto.*;
import com.rewind.rewind.list.entity.ListItem;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.social.entity.ActivityType;
import com.rewind.rewind.social.service.ActivityService;
import com.rewind.rewind.tag.service.TagService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;

@Service
public class MovieListService {

    private final MovieListRepository lists;
    private final ListItemRepository items;
    private final UserRepository users;
    private final MovieRepository movies;
    private final ActivityService activities;
    private final TagService tags;

    public MovieListService(MovieListRepository lists, ListItemRepository items, UserRepository users, MovieRepository movies, ActivityService activities, TagService tags) {
        this.lists = lists;
        this.items = items;
        this.users = users;
        this.movies = movies;
        this.activities = activities;
        this.tags = tags;
    }

    @Transactional(readOnly = true)
    public List<MovieListResponse> myLists(String email) {
        var user = users.findByEmail(email).orElseThrow();
        return lists.findAllByUser(user).stream()
                .map(l -> new MovieListResponse(l.getId(), l.getName(), l.getDescription(), l.getListType(), l.getIsPublic(), tagNames(l)))
                .toList();
    }

    @Transactional
    public MovieListResponse create(String email, CreateListRequest req) {
        var user = users.findByEmail(email).orElseThrow();

        MovieList list = new MovieList();
        list.setUser(user);
        list.setName(req.getName());
        list.setDescription(req.getDescription());
        list.setListType(ListType.CUSTOM);
        list.setIsPublic(req.getIsPublic() != null && req.getIsPublic());

        MovieList saved = lists.save(list);
        tags.replaceTags(saved, req.getTags());
        saved = lists.save(saved);
        if (Boolean.TRUE.equals(saved.getIsPublic())) activities.record(user.getId(), ActivityType.LIST, null, null, saved.getId(), null);
        return new MovieListResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getListType(), saved.getIsPublic(), tagNames(saved));
    }

    // ===== Edit List (name/description/isPublic) =====
    @Transactional
    public MovieListResponse updateMyList(String email, Long listId, UpdateListRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByIdAndUser(listId, user)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));

        if (list.getListType() != ListType.CUSTOM) {
            throw new IllegalArgumentException("System list cannot be edited");
        }

        if (req.getName() != null) list.setName(req.getName());
        if (req.getDescription() != null) list.setDescription(req.getDescription());
        if (req.getIsPublic() != null) list.setIsPublic(req.getIsPublic());
        if (req.getTags() != null) tags.replaceTags(list, req.getTags());

        MovieList saved = lists.save(list);
        return new MovieListResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getListType(), saved.getIsPublic(), tagNames(saved));
    }

    // ===== All Lists (public lists catalog) =====
    @Transactional(readOnly = true)
    public Page<PublicListCardResponse> publicLists(String tag, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)),
                Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<MovieList> source = tag == null || tag.isBlank()
                ? lists.findAllByIsPublicTrueAndListType(ListType.CUSTOM, pageable)
                : lists.findPublicByTag(ListType.CUSTOM, tag.trim().toLowerCase(), pageable);
        return source
                .map(l -> new PublicListCardResponse(
                        l.getId(),
                        l.getName(),
                        l.getDescription(),
                        l.getIsPublic(),
                        l.getUser().getId(),
                        l.getUser().getUsername(),
                        l.getUser().getAvatarUrl(),
                        tagNames(l)
                ));
    }

    @Transactional(readOnly = true)
    public PublicListDetailsResponse publicList(Long listId) {
        var list = lists.findById(listId)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getIsPublic()) && candidate.getListType() == ListType.CUSTOM)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Public list not found"));
        var movies = items.findAllByListId(listId).stream()
                .sorted((left, right) -> {
                    Integer a = left.getPosition();
                    Integer b = right.getPosition();
                    if (a == null && b == null) return 0;
                    if (a == null) return 1;
                    if (b == null) return -1;
                    return a.compareTo(b);
                })
                .map(item -> new MovieCardResponse(item.getMovie().getId(), item.getMovie().getTitle(),
                        item.getMovie().getReleaseDate(), item.getMovie().getRating(), item.getMovie().getPhotoUrl()))
                .toList();
        return new PublicListDetailsResponse(list.getId(), list.getName(), list.getDescription(),
                list.getUser().getId(), list.getUser().getUsername(), list.getUser().getAvatarUrl(), tagNames(list), movies);
    }

    public void addItem(String email, Long listId, AddListItemRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByIdAndUser(listId, user)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));

        if (items.existsByListAndMovieId(list, req.getMovieId())) return;

        var movie = movies.findById(req.getMovieId())
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        ListItem item = new ListItem();
        item.setList(list);
        item.setMovie(movie);

        Integer pos = req.getPosition();
        if (pos == null) {
            var all = items.findAllByListId(list.getId());
            Integer max = null;
            for (ListItem existing : all) {
                Integer position = existing.getPosition();
                if (position != null && (max == null || position > max)) {
                    max = position;
                }
            }
            pos = (max == null ? 0 : max) + 1;
        }
        item.setPosition(pos);

        items.save(item);
    }

    @Transactional
    public void removeItem(String email, Long listId, Long movieId) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByIdAndUser(listId, user)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));

        items.deleteByListIdAndMovieId(list.getId(), movieId);
    }

    // ===== List Items (needed for reorder UI) =====
    @Transactional(readOnly = true)
    public List<ListItemResponse> myListItems(String email, Long listId) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByIdAndUser(listId, user)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));

        return items.findAllByListId(list.getId()).stream()
                .sorted((a, b) -> {
                    Integer pa = a.getPosition();
                    Integer pb = b.getPosition();
                    if (pa == null && pb == null) return 0;
                    if (pa == null) return 1;
                    if (pb == null) return -1;
                    return pa.compareTo(pb);
                })
                .map(li -> new ListItemResponse(
                        li.getId(),
                        li.getPosition(),
                        new MovieCardResponse(
                                li.getMovie().getId(),
                                li.getMovie().getTitle(),
                                li.getMovie().getReleaseDate(),
                                li.getMovie().getRating(),
                                li.getMovie().getPhotoUrl()
                        )
                ))
                .toList();
    }

    // ===== Reorder (position) =====
    @Transactional
    public void reorderMyListItems(String email, Long listId, ReorderListItemsRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        var list = lists.findByIdAndUser(listId, user)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));

        if (list.getListType() != ListType.CUSTOM) {
            throw new IllegalArgumentException("System list cannot be reordered");
        }

        var allItems = items.findAllByListId(list.getId());
        var orderedIds = req.getOrderedItemIds();

        if (orderedIds.size() != allItems.size()) {
            throw new IllegalArgumentException("orderedItemIds must contain all list items");
        }
        if (orderedIds.stream().distinct().count() != orderedIds.size()) {
            throw new IllegalArgumentException("orderedItemIds must not contain duplicates");
        }

        var map = new HashMap<Long, ListItem>();
        for (var it : allItems) map.put(it.getId(), it);

        for (Long id : orderedIds) {
            if (!map.containsKey(id)) throw new IllegalArgumentException("Item does not belong to list: " + id);
        }

        for (var it : allItems) it.setPosition(-1000000 - it.getId().intValue());
        items.saveAll(allItems);

        int pos = 1;
        for (Long id : orderedIds) map.get(id).setPosition(pos++);
        items.saveAll(allItems);
    }

    @SuppressWarnings("null")
    private List<String> tagNames(MovieList list) {
        return list.getTags().stream().map(com.rewind.rewind.tag.entity.Tag::getName).toList();
    }
}
