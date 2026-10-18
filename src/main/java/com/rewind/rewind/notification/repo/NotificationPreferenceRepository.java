package com.rewind.rewind.notification.repo;

import com.rewind.rewind.notification.entity.NotificationPreference;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO notification_preferences "
            + "(user_id, follows_enabled, review_likes_enabled) VALUES (:userId, TRUE, TRUE)",
            nativeQuery = true)
    int insertIgnore(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select p from NotificationPreference p where p.userId = :userId")
    Optional<NotificationPreference> findForUpdate(@Param("userId") Long userId);
}
