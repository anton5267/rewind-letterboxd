package com.rewind.rewind.profile.service;

import com.rewind.rewind.auth.RefreshSessionService;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.entity.MovieList;
import com.rewind.rewind.list.dto.PublicListCardResponse;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.dto.DeleteAccountRequest;
import com.rewind.rewind.profile.dto.ProfileResponse;
import com.rewind.rewind.profile.dto.ProfileUpdateRequest;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.rating.entity.Rating;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.review.entity.Review;
import com.rewind.rewind.social.repo.ReviewLikeRepository;
import com.rewind.rewind.profile.dto.SocialLinkRequest;
import com.rewind.rewind.profile.dto.SocialLinkResponse;
import com.rewind.rewind.profile.entity.UserSocialLink;
import com.rewind.rewind.profile.repo.UserSocialLinkRepository;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.dto.PublicProfileResponse;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.EntityManager;

import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ProfileService {
    private static final Set<String> SUPPORTED_SOCIAL_PLATFORMS = Set.of("website", "instagram", "tiktok", "letterboxd");

    private final UserRepository users;
    private final MovieListRepository lists;
    private final RatingRepository ratings;
    private final ReviewRepository reviews;
    private final ListItemRepository listItems;
    private final PasswordEncoder passwordEncoder;
    private final RefreshSessionService sessions;
    private final EntityManager entityManager;
    private final ReviewLikeRepository reviewLikes;
    private final UserSocialLinkRepository socialLinks;

    public ProfileService(
            UserRepository users,
            MovieListRepository lists,
            RatingRepository ratings,
            ReviewRepository reviews,
            ListItemRepository listItems,
            PasswordEncoder passwordEncoder,
            RefreshSessionService sessions,
            EntityManager entityManager,
            ReviewLikeRepository reviewLikes,
            UserSocialLinkRepository socialLinks
    ) {
        this.users = users;
        this.lists = lists;
        this.ratings = ratings;
        this.reviews = reviews;
        this.listItems = listItems;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.entityManager = entityManager;
        this.reviewLikes = reviewLikes;
        this.socialLinks = socialLinks;
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
                .map(rating -> toProfileRating(rating))
                .collect(Collectors.toList());

        var recentReviews = reviews.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(review -> toProfileReview(review))
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
        var user = findActivePublicUser(userId);
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
        var ratingDistribution = ratings.countDistributionByUserId(userId).stream()
                .map(row -> new PublicProfileResponse.RatingBucket(((Number) row[0]).intValue(), ((Number) row[1]).longValue()))
                .toList();
        return new PublicProfileResponse(user.getId(), user.getUsername(), displayName, user.getAvatarUrl(), user.getIsHq(),
                new PublicProfileResponse.Stats(ratings.countByUserId(userId), reviews.countByUserIdAndIsHiddenFalse(userId), watched, watchlist, favorites),
                ratingDistribution,
                socialLinks.findAllByUserIdOrderByPlatformAsc(userId).stream().map(link -> new SocialLinkResponse(link.getPlatform(), link.getUrl())).toList(),
                publicLists, publicReviews);
    }

    @Transactional(readOnly = true)
    public List<SocialLinkResponse> mySocialLinks(String email) {
        var user = users.findByEmail(email).orElseThrow();
        return socialLinks.findAllByUserIdOrderByPlatformAsc(user.getId()).stream()
                .map(link -> new SocialLinkResponse(link.getPlatform(), link.getUrl())).toList();
    }

    @Transactional
    public List<SocialLinkResponse> updateMySocialLinks(String email, List<SocialLinkRequest> requests) {
        if (requests == null || requests.size() > 8) throw new IllegalArgumentException("Too many social links");
        var user = users.findByEmail(email).orElseThrow();
        Set<String> platforms = requests.stream().map(request -> request.platform().trim().toLowerCase()).collect(Collectors.toSet());
        if (platforms.size() != requests.size()) throw new IllegalArgumentException("Duplicate social platform");
        if (!SUPPORTED_SOCIAL_PLATFORMS.containsAll(platforms)) throw new IllegalArgumentException("Unsupported social platform");
        socialLinks.deleteAllByUserId(user.getId());
        socialLinks.flush();
        for (SocialLinkRequest request : requests) {
            UserSocialLink link = new UserSocialLink();
            link.setUser(user);
            link.setPlatform(request.platform().trim().toLowerCase());
            link.setUrl(request.url().trim());
            socialLinks.save(link);
        }
        return mySocialLinks(email);
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
        var user = findActivePublicUser(userId);
        return systemCollection(user, type, page, size);
    }

    @Transactional(readOnly = true)
    public Page<PublicListCardResponse> publicLists(Long userId, int page, int size) {
        findActivePublicUser(userId);
        Page<MovieList> source =
                lists.findPageByUserIdAndListTypeAndIsPublicTrueOrderByUpdatedAtDescIdDesc(
                        userId, ListType.CUSTOM, pageRequest(page, size));
        List<Long> listIds = new ArrayList<>(source.getContent().size());
        for (MovieList list : source.getContent()) {
            listIds.add(list.getId());
        }
        Map<Long, List<MovieCardResponse>> previews = previewMovies(
                listIds);
        Map<Long, Long> itemCounts = new HashMap<>();
        if (!listIds.isEmpty()) {
            listItems.countByListIds(listIds).forEach(row -> itemCounts.put((Long) row[0], (Long) row[1]));
        }
        return source.map(list -> new PublicListCardResponse(
                list.getId(), list.getName(), list.getDescription(), list.getIsPublic(),
                list.getUser().getId(), list.getUser().getUsername(), list.getUser().getAvatarUrl(),
                list.getTags().stream().map(tag -> tag.getName()).toList(), null,
                itemCounts.getOrDefault(list.getId(), 0L),
                previews.getOrDefault(list.getId(), List.of())));
    }

    private Map<Long, List<MovieCardResponse>> previewMovies(List<Long> listIds) {
        Map<Long, List<MovieCardResponse>> previews = new HashMap<>();
        if (listIds.isEmpty()) return previews;

        for (var item : listItems.findAllByListIdsForPreview(listIds)) {
            Long listId = item.getList().getId();
            List<MovieCardResponse> listPreview = previews.computeIfAbsent(listId, ignored -> new ArrayList<>());
            if (listPreview.size() < 3) {
                var movie = item.getMovie();
                listPreview.add(new MovieCardResponse(movie.getId(), movie.getTitle(), movie.getReleaseDate(),
                        movie.getRating(), movie.getPhotoUrl()));
            }
        }
        return previews;
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
    public Page<PublicProfileResponse.PublicReview> publicLikedReviews(Long userId, int page, int size) {
        findActivePublicUser(userId);
        return reviewLikes.findVisibleReviewLikesByUserId(userId, pageRequest(page, size))
                .map(like -> {
                    var review = like.getReview();
                    return new PublicProfileResponse.PublicReview(review.getId(), review.getMovie().getId(),
                            review.getMovie().getTitle(), review.getContent(),
                            review.getRating() == null ? null : review.getRating().intValue(), review.getUpdatedAt());
                });
    }

    @Transactional(readOnly = true)
    public Page<ProfileResponse.ProfileRatingItem> myRatings(String email, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();
        return ratings.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), pageRequest(page, size))
                .map(rating -> toProfileRating(rating));
    }

    @Transactional(readOnly = true)
    public Page<ProfileResponse.ProfileReviewItem> myReviews(String email, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();
        return reviews.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), pageRequest(page, size))
                .map(review -> toProfileReview(review));
    }

    private Pageable pageRequest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
    }

    private com.rewind.rewind.user.entity.User findActivePublicUser(Long userId) {
        return users.findById(userId)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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

    @Transactional
    public void deleteMyAccount(String email, DeleteAccountRequest req) {
        var user = users.findByEmail(email).orElseThrow();
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        sessions.revokeAllForUser(user.getId());
        entityManager.flush();
        entityManager.createNativeQuery("delete from users where id = :id")
                .setParameter("id", user.getId())
                .executeUpdate();
        entityManager.clear();
    }
}
