BEGIN;

-- The Edge role only needs notification preferences for itself, a user it
-- follows, or the owner of a visible review it liked. Keeping these cases in
-- one policy preserves the former OR behavior while removing the unrestricted
-- USING (TRUE) read path.
DROP POLICY IF EXISTS edge_app_notification_preference_follow_read
  ON rewind.notification_preferences;
DROP POLICY IF EXISTS edge_app_notification_preference_review_like_read
  ON rewind.notification_preferences;

CREATE POLICY edge_app_notification_preference_read
  ON rewind.notification_preferences
  FOR SELECT TO rewind_edge_app
  USING (
    user_id = (SELECT rewind.current_rewind_user_id())
    OR EXISTS (
      SELECT 1
      FROM rewind.follows f
      WHERE f.follower_id = (SELECT rewind.current_rewind_user_id())
        AND f.following_id = notification_preferences.user_id
    )
    OR EXISTS (
      SELECT 1
      FROM rewind.reviews r
      JOIN rewind.review_likes rl ON rl.review_id = r.id
      WHERE r.user_id = notification_preferences.user_id
        AND r.is_hidden = FALSE
        AND rl.user_id = (SELECT rewind.current_rewind_user_id())
    )
  );

COMMIT;
