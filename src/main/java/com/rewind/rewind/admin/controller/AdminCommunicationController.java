package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminConversationResponse;
import com.rewind.rewind.admin.dto.AdminNotificationResponse;
import com.rewind.rewind.admin.service.AdminCommunicationService;
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
    public Page<AdminNotificationResponse> notifications(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.notifications(page, size);
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
}
