package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminListService;
import com.rewind.rewind.list.dto.CreateListRequest;
import com.rewind.rewind.list.service.MovieListService;
import com.rewind.rewind.user.entity.UserRole;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AdminListIntegrationTests {
    @Autowired UserRepository users;
    @Autowired UserService userService;
    @Autowired MovieListService lists;
    @Autowired AdminListService adminLists;

    @Test
    @Transactional
    void adminCanListAndHidePublicLists() {
        String suffix = String.valueOf(System.nanoTime());
        String ownerEmail = "list-owner-" + suffix + "@example.invalid";
        String adminEmail = "list-admin-" + suffix + "@example.invalid";
        register("list-owner-" + suffix, ownerEmail);
        register("list-admin-" + suffix, adminEmail);
        var admin = users.findByEmail(adminEmail).orElseThrow();
        admin.setRole(UserRole.ADMIN);

        var create = new CreateListRequest();
        create.setName("Public list");
        create.setDescription("Description");
        create.setIsPublic(true);
        var created = lists.create(ownerEmail, create);
        var page = adminLists.list(0, 100);
        var row = page.getContent().stream().filter(item -> item.id().equals(created.getId())).findFirst().orElseThrow();
        assertTrue(row.isPublic());

        var hidden = adminLists.setVisibility(created.getId(), false, adminEmail);
        assertFalse(hidden.isPublic());
    }

    private void register(String username, String email) {
        var request = new UserRegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("test-password-123");
        userService.register(request);
    }
}
