-- Allow the Edge API to administer list visibility and remove custom lists.
-- The admin predicate is checked by PostgreSQL RLS on every mutation.
CREATE POLICY edge_app_admin_list_update ON rewind.lists
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin())
  WITH CHECK (rewind.current_user_is_admin());

CREATE POLICY edge_app_admin_custom_list_delete ON rewind.lists
  FOR DELETE TO rewind_edge_app
  USING (rewind.current_user_is_admin() AND list_type = 'CUSTOM');
