package com.rewind.rewind.notification.repo;

import com.rewind.rewind.notification.entity.Notification;
import com.rewind.rewind.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.Instant;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query(value = "select n.id as id, n.recipientId as recipientId, n.actorId as actorId, n.type as type, n.reviewId as reviewId, n.createdAt as createdAt, n.readAt as readAt from Notification n order by n.createdAt desc",
            countQuery = "select count(n) from Notification n")
    Page<AdminNotificationProjection> findAdminRows(Pageable pageable);

    @Query(value = "select n.id as id, n.recipientId as recipientId, n.actorId as actorId, n.type as type, n.reviewId as reviewId, n.createdAt as createdAt, n.readAt as readAt from Notification n where (:type is null or n.type = :type) and (:read is null or (:read = true and n.readAt is not null) or (:read = false and n.readAt is null)) and (:recipientId is null or n.recipientId = :recipientId) order by n.createdAt desc",
            countQuery = "select count(n) from Notification n where (:type is null or n.type = :type) and (:read is null or (:read = true and n.readAt is not null) or (:read = false and n.readAt is null)) and (:recipientId is null or n.recipientId = :recipientId)")
    Page<AdminNotificationProjection> findAdminRows(@Param("type") NotificationType type, @Param("read") Boolean read,
                                                     @Param("recipientId") Long recipientId, Pageable pageable);

    Page<Notification> findAllByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);
    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    @Modifying
    @Query("update Notification n set n.readAt = :readAt where n.recipientId = :recipientId and n.readAt is null")
    int markAllRead(@Param("recipientId") Long recipientId, @Param("readAt") Instant readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.readAt = :readAt where n.readAt is null and (:type is null or n.type = :type) and (:recipientId is null or n.recipientId = :recipientId)")
    int markAdminRead(@Param("type") NotificationType type, @Param("recipientId") Long recipientId, @Param("readAt") Instant readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Notification n where (:type is null or n.type = :type) and (:read is null or (:read = true and n.readAt is not null) or (:read = false and n.readAt is null)) and (:recipientId is null or n.recipientId = :recipientId)")
    int deleteAdmin(@Param("type") NotificationType type, @Param("read") Boolean read, @Param("recipientId") Long recipientId);
}
