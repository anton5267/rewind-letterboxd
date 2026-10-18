package com.rewind.rewind.user.repo;

import com.rewind.rewind.user.entity.User;
import com.rewind.rewind.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByIsActiveTrue();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<User> findAllByRoleAndIsActiveTrue(UserRole role);
    long countByIsHqTrue();

    Page<User> findAllByIsHqTrueAndIsActiveTrue(Pageable pageable);

    Page<User> findAllByIsActiveTrue(Pageable pageable);

    @Query("select u from User u where u.isActive = true and "
            + "(:q is null or :q = '' or lower(u.username) like lower(concat('%', :q, '%')) "
            + "or lower(coalesce(u.displayName, '')) like lower(concat('%', :q, '%')))")
    Page<User> searchPublicDirectory(@Param("q") String q, Pageable pageable);

    // ✅ Для адмінки: пошук по користувачах (q) + пагінація
    Page<User> findAllByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
            String username,
            String email,
            String displayName,
            Pageable pageable
    );
}
