package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ListLikeIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired MovieListService lists;

    @Test
    @Transactional
    void publicListLikesAreIdempotentAndFeedRecentlyLikedAndTeamLists() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String ownerEmail = "list-owner-" + suffix + "@example.invalid";
        String likerEmail = "list-liker-" + suffix + "@example.invalid";
        register("list_owner_" + suffix, ownerEmail);
        register("list_liker_" + suffix, likerEmail);

        var owner = userRepository.findByEmail(ownerEmail).orElseThrow();
        owner.setIsHq(true);
        userRepository.save(owner);

        CreateListRequest request = new CreateListRequest();
        request.setName("Team list " + suffix);
        request.setDescription("A public team collection");
        request.setIsPublic(true);
        request.setTags(java.util.List.of("team"));
        var created = lists.create(ownerEmail, request);
        CreateListRequest unlikedRequest = new CreateListRequest();
        unlikedRequest.setName("Unliked list " + suffix);
        unlikedRequest.setIsPublic(true);
        var unliked = lists.create(ownerEmail, unlikedRequest);

        lists.like(likerEmail, created.getId());
        lists.like(likerEmail, created.getId());

        var status = lists.likeStatus(likerEmail, created.getId());
        assertTrue(status.liked());
        assertEquals(1, status.likes());
        assertTrue(lists.recentlyLikedPublicLists(0, 20).getContent().stream().anyMatch(item -> item.getId().equals(created.getId())));
        assertTrue(lists.teamPublicLists(0, 20).getContent().stream().anyMatch(item -> item.getId().equals(created.getId())));
        var popular = lists.popularPublicLists(0, 100).getContent();
        int likedIndex = indexOf(popular, created.getId());
        int unlikedIndex = indexOf(popular, unliked.getId());
        assertTrue(likedIndex >= 0 && unlikedIndex >= 0 && likedIndex < unlikedIndex,
                "a liked list must rank above an otherwise comparable unliked list");

        lists.unlike(likerEmail, created.getId());
        assertFalse(lists.likeStatus(likerEmail, created.getId()).liked());
        assertEquals(0, lists.likeStatus(likerEmail, created.getId()).likes());
    }

    private void register(String username, String email) {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        users.register(request);
    }

    private int indexOf(java.util.List<com.rewind.rewind.list.dto.PublicListCardResponse> cards, Long id) {
        for (int index = 0; index < cards.size(); index++) {
            if (id.equals(cards.get(index).getId())) return index;
        }
        return -1;
    }
}
