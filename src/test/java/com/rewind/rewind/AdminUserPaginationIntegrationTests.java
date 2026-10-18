package com.rewind.rewind;

import com.rewind.rewind.admin.service.AdminUserService;
import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AdminUserPaginationIntegrationTests {

    @Autowired UserRepository users;
    @Autowired AdminUserService adminUsers;

    @Test
    @Transactional
    void searchPagesEveryMatchingUserWithoutDuplicates() {
        String marker = "page" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        var fixtures = new ArrayList<User>();
        for (int index = 0; index < 55; index++) {
            User user = new User();
            user.setUsername(marker + index);
            user.setEmail(marker + index + "@example.invalid");
            user.setPasswordHash("integration-test-hash");
            user.setDisplayName("Pagination " + marker + " " + index);
            fixtures.add(user);
        }
        users.saveAllAndFlush(fixtures);

        var first = adminUsers.list(marker, 0, 20);
        var second = adminUsers.list(marker, 1, 20);
        var third = adminUsers.list(marker, 2, 20);

        assertEquals(55, first.getTotalElements());
        assertEquals(3, first.getTotalPages());
        assertEquals(20, first.getNumberOfElements());
        assertEquals(20, second.getNumberOfElements());
        assertEquals(15, third.getNumberOfElements());

        var ids = new HashSet<Long>();
        first.forEach(user -> assertTrue(ids.add(user.getId())));
        second.forEach(user -> assertTrue(ids.add(user.getId())));
        third.forEach(user -> assertTrue(ids.add(user.getId())));
        assertEquals(55, ids.size());
        assertTrue(first.getContent().get(0).getId() > third.getContent().get(third.getNumberOfElements() - 1).getId());
    }
}
