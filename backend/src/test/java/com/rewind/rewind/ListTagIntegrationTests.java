package com.rewind.rewind;

import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.dto.UpdateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.tag.service.TagService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ListTagIntegrationTests {
    @Autowired UserService users;
    @Autowired MovieListService lists;
    @Autowired TagService tags;

    @Test
    @Transactional
    void createsUpdatesAndFiltersPublicListsByNormalizedTags() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "tags-" + suffix + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("tags_" + suffix);
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        CreateListRequest create = new CreateListRequest();
        create.setName("Tagged list");
        create.setIsPublic(true);
        create.setTags(List.of("Science Fiction", "Класика"));
        var created = lists.create(email, create);
        assertEquals(2, created.getTags().size());
        assertTrue(created.getTags().containsAll(List.of("Science Fiction", "Класика")));
        assertTrue(lists.publicLists("science-fiction", 0, 20).getContent().stream()
                .anyMatch(list -> list.getId().equals(created.getId())));
        assertTrue(tags.popular(20).stream().anyMatch(tag -> tag.slug().equals("science-fiction")));

        UpdateListRequest update = new UpdateListRequest();
        update.setTags(List.of("Drama"));
        var updated = lists.updateMyList(email, created.getId(), update);
        assertEquals(List.of("Drama"), updated.getTags());
        assertTrue(lists.publicLists("science-fiction", 0, 20).isEmpty());
        assertTrue(lists.publicLists("drama", 0, 20).getContent().stream()
                .anyMatch(list -> list.getId().equals(created.getId())));
    }
}
