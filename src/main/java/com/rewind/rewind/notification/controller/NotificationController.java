package com.rewind.rewind.notification.controller;

import com.rewind.rewind.notification.dto.NotificationResponse;
import com.rewind.rewind.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifications;
    public NotificationController(NotificationService notifications) { this.notifications = notifications; }

    @GetMapping
    public Page<NotificationResponse> mine(Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return notifications.mine(auth.getName(), page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        return Map.of("count", notifications.unreadCount(auth.getName()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable Long id) {
        notifications.markRead(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notifications.markAllRead(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication auth) {
        return notifications.subscribe(auth.getName());
    }
}
