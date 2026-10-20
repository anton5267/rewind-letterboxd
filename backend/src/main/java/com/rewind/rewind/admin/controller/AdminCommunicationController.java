package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminConversationResponse;
import com.rewind.rewind.admin.dto.AdminNotificationResponse;
import com.rewind.rewind.admin.dto.AdminCreateNotificationRequest;
import com.rewind.rewind.admin.service.AdminCommunicationService;
import com.rewind.rewind.notification.entity.NotificationType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminCommunicationController {
    private final AdminCommunicationService service;

    public AdminCommunicationController(AdminCommunicationService service) { this.service = service; }

    @GetMapping("/conversations")
    public Page<AdminConversationResponse> conversations(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.conversations(page, size);
    }

    @GetMapping("/notifications")
    public Page<AdminNotificationResponse> notifications(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size,
                                                         @RequestParam(required = false) NotificationType type,
                                                         @RequestParam(required = false) Boolean read,
                                                         @RequestParam(required = false) Long recipientId) {
        return service.notifications(type, read, recipientId, page, size);
    }

    @PostMapping("/notifications")
    public AdminNotificationResponse createNotification(Authentication auth, @Valid @RequestBody AdminCreateNotificationRequest request) {
        return service.createNotification(auth.getName(), request);
    }

    @DeleteMapping("/conversations/{id}")
    public void deleteConversation(Authentication auth, @PathVariable Long id) {
        service.deleteConversation(auth.getName(), id);
    }

    @DeleteMapping("/notifications/{id}")
    public void deleteNotification(Authentication auth, @PathVariable Long id) {
        service.deleteNotification(auth.getName(), id);
    }

    @PatchMapping("/notifications/{id}/read")
    public AdminNotificationResponse setNotificationRead(Authentication auth, @PathVariable Long id) {
        return service.setNotificationRead(auth.getName(), id, true);
    }

    @PatchMapping("/notifications/{id}/unread")
    public AdminNotificationResponse setNotificationUnread(Authentication auth, @PathVariable Long id) {
        return service.setNotificationRead(auth.getName(), id, false);
    }

    @PatchMapping("/notifications/read-all")
    public java.util.Map<String, Integer> markNotificationsRead(Authentication auth,
                                                                 @RequestParam(required = false) NotificationType type,
                                                                 @RequestParam(required = false) Long recipientId) {
        return java.util.Map.of("updated", service.markNotificationsRead(auth.getName(), type, recipientId));
    }

    @DeleteMapping("/notifications")
    public java.util.Map<String, Integer> deleteNotifications(Authentication auth,
                                                               @RequestParam(required = false) NotificationType type,
                                                               @RequestParam(required = false) Boolean read,
                                                               @RequestParam(required = false) Long recipientId) {
        return java.util.Map.of("deleted", service.deleteNotifications(auth.getName(), type, read, recipientId));
    }
}
