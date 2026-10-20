package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.list.service.system.SystemListItemService;
import com.rewind.rewind.list.entity.ListType;
import com.rewind.rewind.movie.entity.Movie;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.profile.dto.SocialLinkRequest;
import com.rewind.rewind.comment.dto.CreateCommentRequest;
import com.rewind.rewind.comment.service.ReviewCommentService;
import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.review.dto.CreateReviewRequest;
import com.rewind.rewind.review.service.ReviewService;
import com.rewind.rewind.social.service.ReviewLikeService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import java.util.HashSet;
import java.util.List;

@SpringBootTest
@AutoConfigureMockMvc
class PublicProfileIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MovieRepository movies;
    @Autowired ReviewService reviews;
    @Autowired ReviewLikeService reviewLikes;
    @Autowired ReviewCommentService comments;
    @Autowired AdminUserService adminUsers;
    @Autowired MovieListService lists;
    @Autowired SystemListItemService systemLists;
    @Autowired ProfileService profiles;
    @Autowired MockMvc mockMvc;

    @Test
    @Transactional
    void exposesOnlyPublicProfileDataAndVisibleActivity() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "public-profile-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("profile_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("profile_" + suffix))
                .andExpect(jsonPath("$.email").doesNotExist());

        Movie movie = new Movie();
        movie.setTitle("Public profile film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();
        systemLists.add(email, movieId, ListType.WATCHED);
        CreateReviewRequest review = new CreateReviewRequest();
        review.setContent("Visible profile review");
        review.setRating(5);
        Long reviewId = reviews.create(email, movieId, review).getId();
        reviewLikes.like(email, reviewId);

        CreateListRequest publicList = new CreateListRequest();
        publicList.setName("Public profile list");
        publicList.setIsPublic(true);
        lists.create(email, publicList);
        CreateListRequest privateList = new CreateListRequest();
        privateList.setName("Private profile list");
        privateList.setIsPublic(false);
        lists.create(email, privateList);

        var socialLink = new SocialLinkRequest("website", "https://rewind.example/profile");
        assertEquals("https://rewind.example/profile", profiles.updateMySocialLinks(email, List.of(socialLink)).get(0).url());

        var profile = profiles.publicProfile(userId);
        assertEquals("profile_" + suffix, profile.username());
        assertEquals(1, profile.stats().watched());
        assertEquals(1, profile.stats().ratings());
        assertEquals(1, profile.stats().reviews());
        assertEquals(1, profile.lists().size());
        assertEquals("Public profile list", profile.lists().get(0).name());
        assertEquals("Visible profile review", profile.recentReviews().get(0).content());
        assertEquals("https://rewind.example/profile", profile.socialLinks().get(0).url());
        assertEquals(1, profiles.publicLikedReviews(userId, 0, 10).getTotalElements());
        assertEquals(reviewId, profiles.publicLikedReviews(userId, 0, 10).getContent().get(0).id());
        mockMvc.perform(get("/api/users/{id}/liked-reviews", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(reviewId));

        var ownProfile = profiles.myProfile(email);
        assertEquals(1, ownProfile.getStats().getWatched());
        assertEquals(1, ownProfile.getStats().getRatings());
        assertEquals(1, ownProfile.getStats().getReviews());
        assertEquals(1, profiles.myRatings(email, 0, 20).getTotalElements());
        assertEquals(movieId, profiles.myRatings(email, 0, 20).getContent().get(0).getMovieId());
        assertEquals(1, profiles.myReviews(email, 0, 20).getTotalElements());
        assertEquals("Visible profile review", profiles.myReviews(email, 0, 20).getContent().get(0).getContent());
        assertEquals(1, profiles.publicSystemCollection(userId, ListType.WATCHED, 0, 20).getTotalElements());
        assertEquals(movieId, profiles.publicSystemCollection(userId, ListType.WATCHED, 0, 20).getContent().get(0).getId());
    }

    @Test
    @Transactional
    void inactiveUsersAreHiddenFromPublicReads() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "inactive-profile-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("inactive_profile_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        var user = userRepository.findByEmail(email).orElseThrow();
        user.setIsActive(false);
        userRepository.flush();

        mockMvc.perform(get("/api/users/{id}", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/profile", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/collections/watched", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/lists", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/liked-reviews", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/activity", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/followers", user.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{id}/following", user.getId())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void inactiveAuthorsAreExcludedFromPublicFeeds() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String inactiveEmail = "inactive-feed-" + suffix + "@example.invalid";
        String activeEmail = "active-feed-" + suffix + "@example.invalid";
        register(inactiveEmail, "inactive_feed_" + suffix);
        register(activeEmail, "active_feed_" + suffix);
        var inactive = userRepository.findByEmail(inactiveEmail).orElseThrow();

        Movie movie = new Movie();
        movie.setTitle("Inactive feed film " + suffix);
        Long movieId = movies.saveAndFlush(movie).getId();

        systemLists.add(inactiveEmail, movieId, ListType.WATCHED);
        CreateReviewRequest reviewRequest = new CreateReviewRequest();
        reviewRequest.setContent("Should disappear from public feeds");
        reviewRequest.setRating(4);
        Long inactiveReviewId = reviews.create(inactiveEmail, movieId, reviewRequest).getId();
        reviewLikes.like(inactiveEmail, inactiveReviewId);

        CreateListRequest publicList = new CreateListRequest();
        publicList.setName("Inactive public list");
        publicList.setIsPublic(true);
        Long inactiveListId = lists.create(inactiveEmail, publicList).getId();

        CreateReviewRequest activeReviewRequest = new CreateReviewRequest();
        activeReviewRequest.setContent("Active review for inactive commenter");
        activeReviewRequest.setRating(3);
        Long activeReviewId = reviews.create(activeEmail, movieId, activeReviewRequest).getId();
        Long commentId = comments.create(inactiveEmail, activeReviewId,
                new CreateCommentRequest("Comment by a user who will be deactivated")).id();

        adminUsers.deactivate(inactive.getId());
        assertTrue(reviews.listByMovie(movieId, 0, 50).getContent().stream()
                .noneMatch(review -> review.getId().equals(inactiveReviewId)));
        assertTrue(reviews.recent(0, 50).getContent().stream()
                .noneMatch(review -> review.id().equals(inactiveReviewId)));
        assertTrue(reviews.popular(0, 50).getContent().stream()
                .noneMatch(review -> review.id().equals(inactiveReviewId)));
        assertTrue(lists.publicLists(null, 0, 50).getContent().stream()
                .noneMatch(list -> list.getId().equals(inactiveListId)));
        assertTrue(lists.popularPublicLists(0, 50).getContent().stream()
                .noneMatch(list -> list.getId().equals(inactiveListId)));
        assertTrue(comments.list(activeReviewId, 0, 50).getContent().stream()
                .noneMatch(comment -> comment.id().equals(commentId)));
    }

    @Test
    @Transactional
    void pagesOwnAndPublicListsWithoutDuplicates() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "paged-profile-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("paged_profile_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        for (int index = 1; index <= 13; index++) {
            CreateListRequest request = new CreateListRequest();
            request.setName("Paged public list " + index);
            request.setIsPublic(true);
            lists.create(email, request);
        }

        var publicPage1 = profiles.publicLists(userId, 0, 12);
        var publicPage2 = profiles.publicLists(userId, 1, 12);
        assertEquals(13, publicPage1.getTotalElements());
        assertEquals(2, publicPage1.getTotalPages());
        assertEquals(12, publicPage1.getContent().size());
        assertEquals(1, publicPage2.getContent().size());
        var publicIds = new HashSet<Long>();
        publicIds.addAll(publicPage1.getContent().stream().map(item -> item.getId()).toList());
        publicIds.addAll(publicPage2.getContent().stream().map(item -> item.getId()).toList());
        assertEquals(13, publicIds.size());

        var ownPage1 = lists.myListsPage(email, 0, 12);
        assertTrue(ownPage1.getTotalElements() >= 16);
        assertEquals(12, ownPage1.getContent().size());
    }

    @Test
    @Transactional
    void exposesPublicListsToGuestsOverHttp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "guest-public-lists-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("guest_lists_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        CreateListRequest publicList = new CreateListRequest();
        publicList.setName("Guest-visible list");
        publicList.setIsPublic(true);
        lists.create(email, publicList);

        mockMvc.perform(get("/api/users/{id}/lists", userId))
                .andExpect(status().isOk());
    }

    private void register(String email, String username) {
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername(username);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);
    }
}
