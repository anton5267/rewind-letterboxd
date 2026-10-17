package com.rewind.rewind.social.repo;

import com.rewind.rewind.social.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowerId(Long followerId);
    long countByFollowingId(Long followingId);
    Page<Follow> findAllByFollowingIdOrderByCreatedAtDesc(Long followingId, Pageable pageable);
    Page<Follow> findAllByFollowerIdOrderByCreatedAtDesc(Long followerId, Pageable pageable);
    List<Follow> findAllByFollowerId(Long followerId);
}
