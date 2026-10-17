package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
import com.rewind.rewind.admin.dto.ModerateReviewRequest;
import jakarta.validation.Valid;
import com.rewind.rewind.admin.service.AdminModerationQueueService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/admin/moderation")
public class AdminModerationController {
    private final AdminModerationQueueService queue;

    public AdminModerationController(AdminModerationQueueService queue) {
        this.queue = queue;
    }

    @GetMapping("/queue")
    public Page<AdminModerationQueueItem> queue(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return queue.list(page, size);
    }

    @PostMapping("/{type}/{id}/hide")
    public void hide(Authentication auth, @PathVariable String type, @PathVariable Long id,
                     @Valid @RequestBody ModerateReviewRequest request) {
        queue.hide(type, id, auth.getName(), request.getReason());
    }
}
