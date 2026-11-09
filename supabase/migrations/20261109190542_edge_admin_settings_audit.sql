-- Expose only the documented site settings to the server-side admin API.
GRANT SELECT (setting_key, setting_value, updated_by, updated_at)
  ON rewind.site_settings TO rewind_edge_app;
GRANT UPDATE (setting_value, updated_by, updated_at)
  ON rewind.site_settings TO rewind_edge_app;

CREATE POLICY edge_app_admin_site_settings_read ON rewind.site_settings
  FOR SELECT TO rewind_edge_app
  USING (rewind.current_user_is_admin());

CREATE POLICY edge_app_admin_site_settings_update ON rewind.site_settings
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin())
  WITH CHECK (rewind.current_user_is_admin());
