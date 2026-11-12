-- Replace the rating owner FOR ALL policy with operation-specific policies.
-- The owner predicate is folded into the existing combined SELECT rule so
-- each action has one permissive policy without changing its row semantics.
DROP POLICY edge_app_rating_owner ON rewind.ratings;

ALTER POLICY edge_app_ratings_select_combined ON rewind.ratings
  USING (
    user_id = rewind.current_rewind_user_id()
    OR rewind.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM rewind.users u
      WHERE u.id = ratings.user_id AND u.is_active
    )
  );

CREATE POLICY edge_app_ratings_insert_owner ON rewind.ratings
  FOR INSERT TO rewind_edge_app
  WITH CHECK (user_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_ratings_update_owner ON rewind.ratings
  FOR UPDATE TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id())
  WITH CHECK (user_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_ratings_delete_owner ON rewind.ratings
  FOR DELETE TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id());
