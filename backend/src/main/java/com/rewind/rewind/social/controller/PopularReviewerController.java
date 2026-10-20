package com.rewind.rewind.social.controller;

import com.rewind.rewind.social.dto.PopularReviewerResponse;
import com.rewind.rewind.social.service.PopularReviewerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class PopularReviewerController {
    private final PopularReviewerService reviewers;
    public PopularReviewerController(PopularReviewerService reviewers) { this.reviewers = reviewers; }

    @GetMapping("/popular-reviewers")
    public List<PopularReviewerResponse> popular(@RequestParam(defaultValue = "6") int size) {
        return reviewers.popular(size);
    }
}
