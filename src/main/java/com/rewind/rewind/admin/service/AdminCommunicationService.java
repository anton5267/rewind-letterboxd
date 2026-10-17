package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminConversationResponse;
import com.rewind.rewind.admin.dto.AdminNotificationResponse;
import com.rewind.rewind.message.repo.ConversationRepository;
import com.rewind.rewind.notification.repo.NotificationRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCommunicationService {
    private final ConversationRepository conversations;
    private final NotificationRepository notifications;

    public AdminCommunicationService(ConversationRepository conversations, NotificationRepository notifications) {
        this.conversations = conversations;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public Page<AdminConversationResponse> conversations(int page, int size) {
        return conversations.findAdminRows(pageable(page, size)).map(row -> new AdminConversationResponse(
                row.getId(), row.getUserOneId(), row.getUserTwoId(), row.getMessageCount(), row.getCreatedAt(), row.getUpdatedAt(), row.getLastMessageAt()));
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> notifications(int page, int size) {
        return notifications.findAdminRows(pageable(page, size)).map(row -> new AdminNotificationResponse(
                row.getId(), row.getRecipientId(), row.getActorId(), row.getType(), row.getReviewId(), row.getCreatedAt(), row.getReadAt()));
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)));
    }
}
