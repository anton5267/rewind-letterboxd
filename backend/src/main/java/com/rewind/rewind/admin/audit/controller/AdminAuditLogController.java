package com.rewind.rewind.admin.audit.controller;

import com.rewind.rewind.admin.audit.dto.AdminAuditLogResponse;
import com.rewind.rewind.admin.audit.service.AdminAuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {
    private final AdminAuditLogService logs;
    public AdminAuditLogController(AdminAuditLogService logs) { this.logs = logs; }
    @GetMapping
    public Page<AdminAuditLogResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return logs.list(page, size); }
}
