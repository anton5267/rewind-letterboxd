package com.rewind.rewind.admin.controller;

import com.rewind.rewind.admin.dto.AdminDashboardResponse;
import com.rewind.rewind.admin.service.AdminDashboardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {
    private final AdminDashboardService dashboard;
    public AdminDashboardController(AdminDashboardService dashboard) { this.dashboard = dashboard; }
    @GetMapping public AdminDashboardResponse summary() { return dashboard.summary(); }
}
