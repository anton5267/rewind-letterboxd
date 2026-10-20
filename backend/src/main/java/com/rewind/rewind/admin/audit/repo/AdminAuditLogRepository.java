package com.rewind.rewind.admin.audit.repo;

import com.rewind.rewind.admin.audit.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    Page<AdminAuditLog> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
    List<AdminAuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDescIdDesc(String targetType, Long targetId, Pageable pageable);
}
