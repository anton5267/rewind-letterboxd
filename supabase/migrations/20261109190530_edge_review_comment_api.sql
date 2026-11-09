-- Allow the server-only Edge role to manage review comments and likes while
-- preserving user ownership, moderation visibility, and notification privacy.
GRANT INSERT (review_id, user_id), DELETE ON rewind.review_likes TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.review_likes_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_review_likes_insert
  ON rewind.review_likes FOR INSERT TO rewind_edge_app
  WITH CHECK (
    user_id = rewind.current_rewind_user_id()
    AND EXISTS (
      SELECT 1 FROM rewind.reviews r
      JOIN rewind.users author ON author.id = r.user_id
      WHERE r.id = rewind.review_likes.review_id
        AND r.is_hidden = FALSE AND author.is_active = TRUE
    )
  );

CREATE POLICY edge_app_review_likes_delete
  ON rewind.review_likes FOR DELETE TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id());

GRANT SELECT ON rewind.notification_preferences TO rewind_edge_app;
CREATE POLICY edge_app_notification_preference_review_like_read
  ON rewind.notification_preferences FOR SELECT TO rewind_edge_app
  USING (
    user_id = rewind.current_rewind_user_id()
    OR EXISTS (
      SELECT 1 FROM rewind.reviews r
      JOIN rewind.review_likes rl ON rl.review_id = r.id
      WHERE r.user_id = rewind.notification_preferences.user_id
        AND r.is_hidden = FALSE
        AND rl.user_id = rewind.current_rewind_user_id()
    )
  );

GRANT INSERT (recipient_id, actor_id, notification_type, review_id) ON rewind.notifications TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.notifications_id_seq TO rewind_edge_app;
CREATE POLICY edge_app_review_like_notification_insert
  ON rewind.notifications FOR INSERT TO rewind_edge_app
  WITH CHECK (
    notification_type = 'REVIEW_LIKED'
    AND actor_id = rewind.current_rewind_user_id()
    AND actor_id <> recipient_id
    AND review_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rewind.reviews r
      JOIN rewind.users author ON author.id = r.user_id
      WHERE r.id = rewind.notifications.review_id
        AND r.user_id = rewind.notifications.recipient_id
        AND r.is_hidden = FALSE AND author.is_active = TRUE
    )
  );

DROP POLICY edge_app_comment_read ON rewind.comments;
CREATE POLICY edge_app_comment_read
  ON rewind.comments FOR SELECT TO rewind_edge_app
  USING (
    NOT is_hidden
    OR user_id = rewind.current_rewind_user_id()
    OR EXISTS (
      SELECT 1 FROM rewind.users actor
      WHERE actor.id = rewind.current_rewind_user_id() AND actor.role = 'ADMIN'
    )
  );

DROP POLICY edge_app_comment_delete ON rewind.comments;
CREATE POLICY edge_app_comment_delete
  ON rewind.comments FOR DELETE TO rewind_edge_app
  USING (
    user_id = rewind.current_rewind_user_id()
    OR EXISTS (
      SELECT 1 FROM rewind.users actor
      WHERE actor.id = rewind.current_rewind_user_id() AND actor.role = 'ADMIN'
    )
  );
