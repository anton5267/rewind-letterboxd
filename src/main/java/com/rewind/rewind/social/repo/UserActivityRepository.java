package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.UserActivity;
import com.rewind.rewind.social.entity.ActivityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    @Query("select a from UserActivity a where a.userId = :userId and exists "
            + "(select u.id from User u where u.id = a.userId and u.isActive = true) "
            + "order by a.createdAt desc, a.id desc")
    Page<UserActivity> findAllByUserIdOrderByCreatedAtDescIdDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("select a from UserActivity a where a.userId in :userIds and exists "
            + "(select u.id from User u where u.id = a.userId and u.isActive = true) "
            + "order by a.createdAt desc, a.id desc")
    Page<UserActivity> findAllByUserIdInOrderByCreatedAtDescIdDesc(@Param("userIds") Collection<Long> userIds, Pageable pageable);
    @Query("select a from UserActivity a where a.type = :type and exists "
            + "(select u.id from User u where u.id = a.userId and u.isActive = true) "
            + "order by a.createdAt desc, a.id desc")
    Page<UserActivity> findRecentByTypeAndActiveUser(@Param("type") ActivityType type, Pageable pageable);
}
