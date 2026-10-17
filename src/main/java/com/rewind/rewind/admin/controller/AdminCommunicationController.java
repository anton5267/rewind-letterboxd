package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminConversationResponse;
import com.rewind.rewind.admin.dto.AdminNotificationResponse;
import com.rewind.rewind.admin.service.AdminCommunicationService;
import org.springframework.data.domain.Page;
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
}
