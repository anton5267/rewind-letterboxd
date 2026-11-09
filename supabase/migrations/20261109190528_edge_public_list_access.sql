-- Scope list/tag/like access to the server-side Edge role. Activity writes use
-- the owner policy from the earlier rating API migration. The private rewind
-- schema remains unavailable to browser Data API roles.
GRANT SELECT ON rewind.tags, rewind.list_tags, rewind.list_likes TO rewind_edge_app;
GRANT INSERT (name, slug) ON rewind.tags TO rewind_edge_app;
GRANT INSERT (list_id, tag_id), DELETE ON rewind.list_tags TO rewind_edge_app;
GRANT INSERT (list_id, user_id), DELETE ON rewind.list_likes TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.tags_id_seq, rewind.list_likes_id_seq TO rewind_edge_app;
GRANT SELECT ON rewind.review_likes TO rewind_edge_app;

ALTER TABLE rewind.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewind.list_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewind.list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewind.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewind.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY edge_app_tags_read
  ON rewind.tags FOR SELECT TO rewind_edge_app
  USING (TRUE);

CREATE POLICY edge_app_tags_insert
  ON rewind.tags FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_rewind_user_id() IS NOT NULL);

CREATE POLICY edge_app_list_tags_read
  ON rewind.list_tags FOR SELECT TO rewind_edge_app
  USING (EXISTS (
    SELECT 1 FROM rewind.lists l
    WHERE l.id = rewind.list_tags.list_id
      AND ((l.list_type = 'CUSTOM' AND l.is_public)
        OR l.user_id = rewind.current_rewind_user_id())
  ));

CREATE POLICY edge_app_list_tags_insert
  ON rewind.list_tags FOR INSERT TO rewind_edge_app
  WITH CHECK (EXISTS (
    SELECT 1 FROM rewind.lists l
    WHERE l.id = rewind.list_tags.list_id AND l.list_type = 'CUSTOM'
      AND l.user_id = rewind.current_rewind_user_id()
  ));

CREATE POLICY edge_app_list_tags_delete
  ON rewind.list_tags FOR DELETE TO rewind_edge_app
  USING (EXISTS (
    SELECT 1 FROM rewind.lists l
    WHERE l.id = rewind.list_tags.list_id AND l.list_type = 'CUSTOM'
      AND l.user_id = rewind.current_rewind_user_id()
  ));

CREATE POLICY edge_app_list_likes_read
  ON rewind.list_likes FOR SELECT TO rewind_edge_app
  USING (
    user_id = rewind.current_rewind_user_id()
    OR EXISTS (
      SELECT 1 FROM rewind.lists l
      JOIN rewind.users owner ON owner.id = l.user_id
      WHERE l.id = rewind.list_likes.list_id AND l.list_type = 'CUSTOM'
        AND l.is_public AND owner.is_active
    )
  );

CREATE POLICY edge_app_list_likes_insert
  ON rewind.list_likes FOR INSERT TO rewind_edge_app
  WITH CHECK (
    user_id = rewind.current_rewind_user_id()
    AND EXISTS (
      SELECT 1 FROM rewind.lists l
      JOIN rewind.users owner ON owner.id = l.user_id
      WHERE l.id = rewind.list_likes.list_id AND l.list_type = 'CUSTOM'
        AND l.is_public AND owner.is_active
    )
  );

CREATE POLICY edge_app_list_likes_delete
  ON rewind.list_likes FOR DELETE TO rewind_edge_app
  USING (
    user_id = rewind.current_rewind_user_id()
    AND EXISTS (
      SELECT 1 FROM rewind.lists l
      JOIN rewind.users owner ON owner.id = l.user_id
      WHERE l.id = rewind.list_likes.list_id AND l.list_type = 'CUSTOM'
        AND l.is_public AND owner.is_active
    )
  );

CREATE POLICY edge_app_review_likes_read
  ON rewind.review_likes FOR SELECT TO rewind_edge_app
  USING (EXISTS (
    SELECT 1 FROM rewind.reviews r
    JOIN rewind.users author ON author.id = r.user_id
    WHERE r.id = rewind.review_likes.review_id AND r.is_hidden = FALSE AND author.is_active
  ));
