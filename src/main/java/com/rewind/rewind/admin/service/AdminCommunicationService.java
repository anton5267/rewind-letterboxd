package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminConversationResponse;
import com.rewind.rewind.admin.dto.AdminNotificationResponse;
import com.rewind.rewind.admin.dto.AdminCreateNotificationRequest;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import com.rewind.rewind.message.repo.ConversationRepository;
import com.rewind.rewind.notification.service.NotificationService;
import com.rewind.rewind.notification.repo.NotificationRepository;
import com.rewind.rewind.notification.entity.NotificationType;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class AdminCommunicationService {
    private final ConversationRepository conversations;
    private final NotificationRepository notifications;
    private final NotificationService notificationService;
    private final AdminAuditLogService audit;

    public AdminCommunicationService(ConversationRepository conversations, NotificationRepository notifications,
                                     NotificationService notificationService, AdminAuditLogService audit) {
        this.conversations = conversations;
        this.notifications = notifications;
        this.notificationService = notificationService;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Page<AdminConversationResponse> conversations(int page, int size) {
        return conversations.findAdminRows(pageable(page, size)).map(row -> new AdminConversationResponse(
                row.getId(), row.getUserOneId(), row.getUserTwoId(), row.getMessageCount(), row.getCreatedAt(), row.getUpdatedAt(), row.getLastMessageAt()));
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> notifications(int page, int size) {
        return notifications(null, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> notifications(NotificationType type, Boolean read, Long recipientId, int page, int size) {
        return notifications.findAdminRows(type, read, recipientId, pageable(page, size)).map(row -> new AdminNotificationResponse(
                row.getId(), row.getRecipientId(), row.getActorId(), row.getType(), row.getReviewId(), row.getCreatedAt(), row.getReadAt()));
    }

    @Transactional
    public int markNotificationsRead(String adminEmail, NotificationType type, Long recipientId) {
        int updated = notifications.markAdminRead(type, recipientId, Instant.now());
        audit.record(adminEmail, "NOTIFICATIONS_MARKED_READ", "NOTIFICATION", null,
                "count=" + updated + ";type=" + type + ";recipientId=" + recipientId);
        return updated;
    }

    @Transactional
    public int deleteNotifications(String adminEmail, NotificationType type, Boolean read, Long recipientId) {
        int deleted = notifications.deleteAdmin(type, read, recipientId);
        audit.record(adminEmail, "NOTIFICATIONS_BULK_DELETED", "NOTIFICATION", null,
                "count=" + deleted + ";type=" + type + ";read=" + read + ";recipientId=" + recipientId);
        return deleted;
    }

    @Transactional
    public AdminNotificationResponse createNotification(String adminEmail, AdminCreateNotificationRequest request) {
        var created = notificationService.createAdmin(request.recipientId(), request.type(), request.actorId(),
                request.relatedUserId(), request.reviewId());
        audit.record(adminEmail, "NOTIFICATION_CREATED", "NOTIFICATION", created.id(), null);
        return new AdminNotificationResponse(created.id(), request.recipientId(),
                created.actor() == null ? null : created.actor().id(), created.type(), created.reviewId(),
                created.createdAt(), created.readAt());
    }

    @Transactional
    public void deleteConversation(String adminEmail, Long id) {
        if (!conversations.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
        conversations.deleteById(id);
        audit.record(adminEmail, "CONVERSATION_DELETED", "CONVERSATION", id, null);
    }

    @Transactional
    public void deleteNotification(String adminEmail, Long id) {
        if (!notifications.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        notifications.deleteById(id);
        audit.record(adminEmail, "NOTIFICATION_DELETED", "NOTIFICATION", id, null);
    }

    @Transactional
    public AdminNotificationResponse setNotificationRead(String adminEmail, Long id, boolean read) {
        var notification = notifications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setReadAt(read ? (notification.getReadAt() == null ? Instant.now() : notification.getReadAt()) : null);
        notifications.save(notification);
        audit.record(adminEmail, read ? "NOTIFICATION_MARKED_READ" : "NOTIFICATION_MARKED_UNREAD", "NOTIFICATION", id, null);
        return new AdminNotificationResponse(notification.getId(), notification.getRecipientId(), notification.getActorId(),
                notification.getType(), notification.getReviewId(), notification.getCreatedAt(), notification.getReadAt());
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)));
    }
}
