package com.rewind.rewind.profile.service;

import com.rewind.rewind.auth.RefreshSessionService;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.dto.ProfileResponse;
import com.rewind.rewind.profile.dto.ProfileUpdateRequest;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.rating.entity.Rating;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.dto.PublicProfileResponse;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserRepository users;
    private final MovieListRepository lists;
    private final RatingRepository ratings;
    private final ReviewRepository reviews;
    private final ListItemRepository listItems;
    private final PasswordEncoder passwordEncoder;
    private final RefreshSessionService sessions;

    public ProfileService(
            UserRepository users,
            MovieListRepository lists,
            RatingRepository ratings,
            ReviewRepository reviews,
            ListItemRepository listItems,
            PasswordEncoder passwordEncoder,
            RefreshSessionService sessions
    ) {
        this.users = users;
        this.lists = lists;
        this.ratings = ratings;
        this.reviews = reviews;
        this.listItems = listItems;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
    }

    public ProfileResponse myProfile(String email) {
        var user = users.findByEmail(email).orElseThrow();

        var allLists = lists.findAllByUser(user);
        var profileLists = allLists.stream()
                .map(l -> new ProfileResponse.ProfileListItem(
                        l.getId(), l.getName(), l.getListType(), l.getIsPublic()
                ))
                .collect(Collectors.toList());

        var recentRatings = ratings.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::toProfileRating)
                .collect(Collectors.toList());

        var recentReviews = reviews.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::toProfileReview)
                .collect(Collectors.toList());

        String displayName = user.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = user.getUsername();
        }
        var stats = new ProfileResponse.ProfileStats(
                ratings.countByUserId(user.getId()),
                reviews.countByUserIdAndIsHiddenFalse(user.getId()),
                collectionCount(allLists, ListType.WATCHED),
                collectionCount(allLists, ListType.WATCHLIST),
                collectionCount(allLists, ListType.FAVORITES));

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                displayName,
                user.getEmail(),
                user.getRole().name(),
                user.getAvatarUrl(),
                stats,
                profileLists,
                recentRatings,
                recentReviews
        );
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse publicProfile(Long userId) {
        var user = users.findById(userId).orElseThrow();
        var allLists = lists.findAllByUser(user);
        var publicLists = allLists.stream()
                .filter(list -> list.getListType() == ListType.CUSTOM && Boolean.TRUE.equals(list.getIsPublic()))
                .map(list -> new PublicProfileResponse.PublicList(list.getId(), list.getName(), list.getDescription()))
                .toList();
        var reviewsPage = reviews.findAllByUserIdAndIsHidden(userId, false, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt")));
        var publicReviews = reviewsPage.getContent().stream()
                .map(review -> new PublicProfileResponse.PublicReview(review.getId(), review.getMovie().getId(),
                        review.getMovie().getTitle(), review.getContent(),
                        review.getRating() == null ? null : review.getRating().intValue(), review.getUpdatedAt()))
                .toList();
        long watched = collectionCount(allLists, ListType.WATCHED);
        long watchlist = collectionCount(allLists, ListType.WATCHLIST);
        long favorites = collectionCount(allLists, ListType.FAVORITES);
        String displayName = user.getDisplayName() == null || user.getDisplayName().isBlank() ? user.getUsername() : user.getDisplayName();
        return new PublicProfileResponse(user.getId(), user.getUsername(), displayName, user.getAvatarUrl(),
                new PublicProfileResponse.Stats(ratings.countByUserId(userId), reviews.countByUserIdAndIsHiddenFalse(userId), watched, watchlist, favorites),
                publicLists, publicReviews);
    }

    private long collectionCount(java.util.List<com.rewind.rewind.list.entity.MovieList> allLists, ListType type) {
        return allLists.stream().filter(list -> list.getListType() == type).findFirst()
                .map(list -> listItems.countByListId(list.getId())).orElse(0L);
    }

    public Page<MovieCardResponse> mySystemCollection(String email, ListType type, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();
        return systemCollection(user, type, page, size);
    }

    @Transactional(readOnly = true)
    public Page<MovieCardResponse> publicSystemCollection(Long userId, ListType type, int page, int size) {
        var user = users.findById(userId).orElseThrow();
        return systemCollection(user, type, page, size);
    }

    private Page<MovieCardResponse> systemCollection(com.rewind.rewind.user.entity.User user, ListType type, int page, int size) {
        var list = lists.findByUserAndListType(user, type).orElseThrow();
        Pageable pageable = pageRequest(page, size);
        return listItems.findMoviesByListId(list.getId(), pageable)
                .map(m -> new MovieCardResponse(
                        m.getId(),
                        m.getTitle(),
                        m.getReleaseDate(),
                        m.getRating(),
                        m.getPhotoUrl()
                ));
    }

    @Transactional(readOnly = true)
    public Page<ProfileResponse.ProfileRatingItem> myRatings(String email, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();
        return ratings.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), pageRequest(page, size))
                .map(this::toProfileRating);
    }

    @Transactional(readOnly = true)
    public Page<ProfileResponse.ProfileReviewItem> myReviews(String email, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();
        return reviews.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), pageRequest(page, size))
                .map(this::toProfileReview);
    }

    private Pageable pageRequest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
    }

    private ProfileResponse.ProfileRatingItem toProfileRating(Rating rating) {
        return new ProfileResponse.ProfileRatingItem(
                rating.getMovie().getId(), rating.getMovie().getTitle(), rating.getMovie().getPhotoUrl(),
                rating.getRating().intValue(), rating.getUpdatedAt());
    }

    private ProfileResponse.ProfileReviewItem toProfileReview(Review review) {
        return new ProfileResponse.ProfileReviewItem(
                review.getId(), review.getMovie().getId(), review.getMovie().getTitle(), review.getContent(), review.getUpdatedAt());
    }

    @Transactional
    public ProfileResponse updateMyProfile(String email, ProfileUpdateRequest req) {
        var user = users.findByEmail(email).orElseThrow();

        if (req.getDisplayName() != null) {
            String dn = req.getDisplayName().trim();
            user.setDisplayName(dn.isBlank() ? null : dn);
        }

        if (req.getAvatarUrl() != null) {
            String au = req.getAvatarUrl().trim();
            user.setAvatarUrl(au.isBlank() ? null : au);
        }

        users.save(user);
        return myProfile(email);
    }

    @Transactional
    public void changeMyPassword(String email, ChangePasswordRequest req) {
        var user = users.findByEmail(email).orElseThrow();

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        users.save(user);
        sessions.revokeAllForUser(user.getId());
    }
}
