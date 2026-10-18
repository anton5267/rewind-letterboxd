package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO user_blocks (blocker_id, blocked_id, created_at) VALUES (:blockerId, :blockedId, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertIgnore(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    long deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
