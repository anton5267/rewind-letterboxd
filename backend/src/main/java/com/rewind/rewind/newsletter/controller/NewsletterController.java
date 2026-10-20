package com.rewind.rewind.newsletter.controller;

import com.rewind.rewind.newsletter.dto.NewsletterSubscriptionRequest;
import com.rewind.rewind.newsletter.dto.NewsletterSubscriptionResponse;
import com.rewind.rewind.newsletter.service.NewsletterSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter/subscription")
public class NewsletterController {
    private final NewsletterSubscriptionService service;

    public NewsletterController(NewsletterSubscriptionService service) { this.service = service; }

    @GetMapping
    public NewsletterSubscriptionResponse get(Authentication authentication) {
        return service.get(authentication.getName());
    }

    @PutMapping
    public NewsletterSubscriptionResponse set(Authentication authentication,
                                              @Valid @RequestBody NewsletterSubscriptionRequest request) {
        return service.set(authentication.getName(), request.subscribed());
    }
}
