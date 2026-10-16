package com.rewind.rewind.user.repo;

import com.rewind.rewind.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // ✅ Для адмінки: пошук по користувачах (q) + пагінація
    Page<User> findAllByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
            String username,
            String email,
            String displayName,
            Pageable pageable
    );
}
