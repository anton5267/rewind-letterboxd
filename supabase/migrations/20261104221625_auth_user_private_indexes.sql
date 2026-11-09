-- Keep the public-profile and owner checks in one policy and index all private
-- moderation/movie foreign-key columns for their referential actions.
DROP POLICY edge_app_user_self_select ON rewind.users;
DROP POLICY edge_app_user_select ON rewind.users;
CREATE POLICY edge_app_user_select ON rewind.users FOR SELECT TO rewind_edge_app
  USING (is_active OR supabase_user_id = rewind.current_supabase_uid());

CREATE INDEX comments_moderated_by_idx ON rewind.comments(moderated_by);
CREATE INDEX list_items_movie_idx ON rewind.list_items(movie_id);
CREATE INDEX reviews_moderated_by_idx ON rewind.reviews(moderated_by);
