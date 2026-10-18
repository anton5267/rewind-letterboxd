package com.rewind.rewind.profile.repo;

import com.rewind.rewind.profile.entity.UserSocialLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSocialLinkRepository extends JpaRepository<UserSocialLink, Long> {
    List<UserSocialLink> findAllByUserIdOrderByPlatformAsc(Long userId);
    void deleteAllByUserId(Long userId);
}
