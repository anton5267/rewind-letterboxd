-- Narrow administrator access for the existing Admin Users screens.
-- Credentials and email ownership are never writable through this API.
GRANT SELECT (email, created_at, is_hq) ON rewind.users TO rewind_edge_app;
GRANT UPDATE (username, display_name, avatar_url, is_active, role, is_hq, updated_at)
  ON rewind.users TO rewind_edge_app;

CREATE POLICY edge_app_admin_user_update ON rewind.users
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin())
  WITH CHECK (rewind.current_user_is_admin());

CREATE POLICY edge_app_admin_rating_read ON rewind.ratings
  FOR SELECT TO rewind_edge_app USING (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_list_read ON rewind.lists
  FOR SELECT TO rewind_edge_app USING (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_list_item_read ON rewind.list_items
  FOR SELECT TO rewind_edge_app USING (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_review_like_read ON rewind.review_likes
  FOR SELECT TO rewind_edge_app USING (rewind.current_user_is_admin());
GRANT SELECT ON rewind.review_likes TO rewind_edge_app;

GRANT SELECT ON rewind.admin_audit_logs TO rewind_edge_app;
CREATE POLICY edge_app_admin_audit_read ON rewind.admin_audit_logs
  FOR SELECT TO rewind_edge_app USING (rewind.current_user_is_admin());
