package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminModerationQueueItem;
import com.rewind.rewind.admin.dto.ModerateReviewRequest;
import com.rewind.rewind.admin.dto.AdminBulkModerationRequest;
import jakarta.validation.Valid;
import com.rewind.rewind.admin.service.AdminModerationQueueService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
                                                @RequestParam(defaultValue = "20") int size,
                                                @RequestParam(required = false) String type,
                                                @RequestParam(required = false) String query) {
        return queue.list(type, query, page, size);
    }

    @PostMapping("/{type}/{id}/hide")
    public void hide(Authentication auth, @PathVariable String type, @PathVariable Long id,
                     @Valid @RequestBody ModerateReviewRequest request) {
        queue.hide(type, id, auth.getName(), request.getReason());
    }

    @PostMapping("/bulk-hide")
    public java.util.Map<String, Integer> hideBulk(Authentication auth, @Valid @RequestBody AdminBulkModerationRequest request) {
        return java.util.Map.of("hidden", queue.hideBulk(request.items(), auth.getName(), request.reason()));
    }
}
