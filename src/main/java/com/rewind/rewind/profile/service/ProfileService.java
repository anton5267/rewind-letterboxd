package com.rewind.rewind.profile.service;

import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.list.repo.ListItemRepository;
import com.rewind.rewind.list.repo.MovieListRepository;
import com.rewind.rewind.movie.dto.MovieCardResponse;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.profile.dto.ProfileResponse;
import com.rewind.rewind.profile.dto.ProfileUpdateRequest;
import com.rewind.rewind.rating.repo.RatingRepository;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.repo.UserRepository;
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

    public ProfileService(
            UserRepository users,
            MovieListRepository lists,
            RatingRepository ratings,
            ReviewRepository reviews,
            ListItemRepository listItems,
            PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.lists = lists;
        this.ratings = ratings;
        this.reviews = reviews;
        this.listItems = listItems;
        this.passwordEncoder = passwordEncoder;
    }

    public ProfileResponse myProfile(String email) {
        var user = users.findByEmail(email).orElseThrow();

        var profileLists = lists.findAllByUser(user).stream()
                .map(l -> new ProfileResponse.ProfileListItem(
                        l.getId(), l.getName(), l.getListType(), l.getIsPublic()
                ))
                .collect(Collectors.toList());

        var recentRatings = ratings.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(r -> new ProfileResponse.ProfileRatingItem(
                        r.getMovie().getId(),
                        r.getMovie().getTitle(),
                        r.getMovie().getPhotoUrl(),
                        r.getRating().intValue(),
                        r.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        var recentReviews = reviews.findAllByUserIdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(rv -> new ProfileResponse.ProfileReviewItem(
                        rv.getId(),
                        rv.getMovie().getId(),
                        rv.getMovie().getTitle(),
                        rv.getContent(),
                        rv.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        String displayName = user.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = user.getUsername();
        }

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                displayName,
                user.getEmail(),
                user.getRole().name(),
                user.getAvatarUrl(),
                profileLists,
                recentRatings,
                recentReviews
        );
    }

    public Page<MovieCardResponse> mySystemCollection(String email, ListType type, int page, int size) {
        var user = users.findByEmail(email).orElseThrow();

        var list = lists.findByUserAndListType(user, type).orElseThrow();

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        return listItems.findMoviesByListId(list.getId(), pageable)
                .map(m -> new MovieCardResponse(
                        m.getId(),
                        m.getTitle(),
                        m.getReleaseDate(),
                        m.getRating(),
                        m.getPhotoUrl()
                ));
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
    }
}
