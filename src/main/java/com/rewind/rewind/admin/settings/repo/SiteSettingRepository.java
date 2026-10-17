package com.rewind.rewind.admin.settings.repo;

import com.rewind.rewind.admin.settings.entity.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteSettingRepository extends JpaRepository<SiteSetting, String> {}
