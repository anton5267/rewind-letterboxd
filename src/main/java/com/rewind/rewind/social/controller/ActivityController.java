package com.rewind.rewind.social.controller;

import com.rewind.rewind.social.dto.ActivityResponse;
import com.rewind.rewind.social.service.ActivityService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ActivityController {
    private final ActivityService activities;
    public ActivityController(ActivityService activities) { this.activities = activities; }

    @GetMapping("/users/{id}/activity")
    public Page<ActivityResponse> profile(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return activities.profile(id, page, size);
    }

    @GetMapping("/activity/following")
    public Page<ActivityResponse> following(Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return activities.following(auth.getName(), page, size);
    }
}
