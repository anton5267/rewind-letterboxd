package com.rewind.rewind.admin.service;

import com.rewind.rewind.admin.dto.AdminDashboardResponse;
import com.rewind.rewind.movie.repo.MovieRepository;
import com.rewind.rewind.review.repo.ReviewRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {
    private final UserRepository users; private final MovieRepository movies; private final ReviewRepository reviews;
    public AdminDashboardService(UserRepository users, MovieRepository movies, ReviewRepository reviews) { this.users = users; this.movies = movies; this.reviews = reviews; }
    public AdminDashboardResponse summary() { return new AdminDashboardResponse(users.count(), users.countByIsActiveTrue(), users.countByIsHqTrue(), movies.count(), reviews.count(), reviews.countByIsHiddenTrue()); }
}
