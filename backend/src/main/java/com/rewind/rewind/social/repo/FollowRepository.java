package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowerId(Long followerId);
    long countByFollowingId(Long followingId);
    @Query("select f from Follow f where f.following.id = :followingId and f.follower.isActive = true order by f.createdAt desc, f.id desc")
    Page<Follow> findFollowersPage(@Param("followingId") Long followingId, Pageable pageable);
    @Query("select f from Follow f where f.follower.id = :followerId and f.following.isActive = true order by f.createdAt desc, f.id desc")
    Page<Follow> findFollowingPage(@Param("followerId") Long followerId, Pageable pageable);
    @Query("select count(f) from Follow f where f.following.id = :followingId and f.follower.isActive = true")
    long countActiveFollowers(@Param("followingId") Long followingId);
    @Query("select count(f) from Follow f where f.follower.id = :followerId and f.following.isActive = true")
    long countActiveFollowing(@Param("followerId") Long followerId);
    List<Follow> findAllByFollowerId(Long followerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT IGNORE INTO follows (follower_id, following_id, created_at) "
            + "VALUES (:followerId, :followingId, CURRENT_TIMESTAMP)", nativeQuery = true)
    int insertIgnore(@Param("followerId") Long followerId,
                     @Param("followingId") Long followingId);
}
