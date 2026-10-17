package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    Page<UserActivity> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<UserActivity> findAllByUserIdInOrderByCreatedAtDesc(Collection<Long> userIds, Pageable pageable);
}
