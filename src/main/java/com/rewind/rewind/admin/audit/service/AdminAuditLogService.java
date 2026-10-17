package com.rewind.rewind.admin.audit.service;

import com.rewind.rewind.admin.audit.dto.AdminAuditLogResponse;
import com.rewind.rewind.admin.audit.entity.AdminAuditLog;
import com.rewind.rewind.admin.audit.repo.AdminAuditLogRepository;
import com.rewind.rewind.user.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuditLogService {
    private final AdminAuditLogRepository logs;
    private final UserRepository users;
    public AdminAuditLogService(AdminAuditLogRepository logs, UserRepository users) { this.logs = logs; this.users = users; }

    @Transactional
    public void record(String adminEmail, String action, String targetType, Long targetId, String metadata) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(users.findByEmail(adminEmail).orElseThrow().getId());
        log.setAction(action); log.setTargetType(targetType); log.setTargetId(targetId); log.setMetadata(metadata);
        logs.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> list(int page, int size) {
        return logs.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100))))
                .map(log -> new AdminAuditLogResponse(log.getId(), log.getAdminId(), log.getAction(), log.getTargetType(), log.getTargetId(), log.getMetadata(), log.getCreatedAt()));
    }
}
