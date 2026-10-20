package com.rewind.rewind;

import com.rewind.rewind.auth.ResetPasswordRequest;
import com.rewind.rewind.profile.dto.ChangePasswordRequest;
import com.rewind.rewind.user.dto.UserLoginRequest;
import com.rewind.rewind.user.dto.UserRegisterRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordValidationTests {
    private static final ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    private static final Validator validator = factory.getValidator();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    static Stream<Arguments> byteBoundaries() {
        return Stream.of(
                Arguments.of("ASCII 72 bytes", "a".repeat(72), true),
                Arguments.of("ASCII 73 bytes", "a".repeat(73), false),
                Arguments.of("Ukrainian 72 bytes", "ї".repeat(36), true),
                Arguments.of("Ukrainian 74 bytes", "ї".repeat(37), false),
                Arguments.of("Emoji 72 bytes", "🔑".repeat(18), true),
                Arguments.of("Emoji 76 bytes", "🔑".repeat(19), false));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("byteBoundaries")
    void writingDtosAgreeWithTheActualEncoder(String name, String password, boolean accepted) {
        assertEquals(accepted, valid(UserRegisterRequest.class, "password", password), "register: " + name);
        assertEquals(accepted, valid(ResetPasswordRequest.class, "newPassword", password), "reset: " + name);
        assertEquals(accepted, valid(ChangePasswordRequest.class, "newPassword", password), "profile: " + name);
        if (accepted) {
            assertTrue(encoder.matches(password, encoder.encode(password)), name);
        } else {
            assertThrows(IllegalArgumentException.class, () -> encoder.encode(password), name);
        }
    }

    @Test
    void existingMinimumsAndSixCharacterLoginRemainSupported() {
        String legacyPassword = "legacy";
        assertTrue(valid(UserRegisterRequest.class, "password", legacyPassword));
        assertTrue(valid(UserLoginRequest.class, "password", legacyPassword));
        assertTrue(encoder.matches(legacyPassword, encoder.encode(legacyPassword)));
        assertFalse(valid(UserRegisterRequest.class, "password", "short"));
        assertFalse(valid(ResetPasswordRequest.class, "newPassword", "short77"));
        assertFalse(valid(ChangePasswordRequest.class, "newPassword", "short77"));
        assertTrue(valid(ResetPasswordRequest.class, "newPassword", "eight888"));
        assertTrue(valid(ChangePasswordRequest.class, "newPassword", "eight888"));
    }

    @Test
    void loginValidationIsNotTightenedByTheWritingLimit() {
        assertTrue(valid(UserLoginRequest.class, "password", "a".repeat(100)));
        assertTrue(valid(UserLoginRequest.class, "password", "ї".repeat(37)));
        assertFalse(valid(UserLoginRequest.class, "password", "a".repeat(101)));
    }

    @Test
    void requiredPasswordValidationIsPreserved() {
        for (String password : new String[] { null, "", "        " }) {
            assertFalse(valid(UserRegisterRequest.class, "password", password));
            assertFalse(valid(ResetPasswordRequest.class, "newPassword", password));
            assertFalse(valid(ChangePasswordRequest.class, "newPassword", password));
        }
    }

    private <T> boolean valid(Class<T> type, String property, String value) {
        return validator.validateValue(type, property, value).isEmpty();
    }
}
