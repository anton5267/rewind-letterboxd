package com.rewind.rewind.admin.dto;

public record AdminDashboardResponse(long users, long activeUsers, long hqUsers, long movies, long reviews, long hiddenReviews) {}
