package com.rewind.rewind;

import com.rewind.rewind.profile.dto.DeleteAccountRequest;
import com.rewind.rewind.profile.service.ProfileService;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import com.rewind.rewind.user.repo.UserRepository;
import com.rewind.rewind.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AccountDeletionIntegrationTests {
    @Autowired UserService users;
    @Autowired UserRepository userRepository;
    @Autowired ProfileService profile;

    @Test
    @Transactional
    void accountDeletionRequiresPasswordAndRemovesUserData() {
        String email = "delete-account-" + System.nanoTime() + "@example.invalid";
        UserRegisterRequest registration = new UserRegisterRequest();
        registration.setUsername("delete-account-user-" + System.nanoTime());
        registration.setEmail(email);
        registration.setPassword("test-password-123");
        users.register(registration);

        DeleteAccountRequest wrong = new DeleteAccountRequest();
        wrong.setCurrentPassword("wrong-password");
        assertThrows(IllegalArgumentException.class, () -> profile.deleteMyAccount(email, wrong));
        assertTrue(userRepository.findByEmail(email).isPresent());

        DeleteAccountRequest correct = new DeleteAccountRequest();
        correct.setCurrentPassword("test-password-123");
        profile.deleteMyAccount(email, correct);
        assertTrue(userRepository.findByEmail(email).isEmpty());
    }
}
