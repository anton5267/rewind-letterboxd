-- FOLLOW notifications are a side effect of a real follow relationship.
-- Require the relationship here as defense in depth, not only in Edge code.
DROP POLICY IF EXISTS edge_app_follow_notification_insert ON rewind.notifications;

CREATE POLICY edge_app_follow_notification_insert ON rewind.notifications
  FOR INSERT TO rewind_edge_app
  WITH CHECK (
    notification_type = 'FOLLOW'
    AND actor_id = rewind.current_rewind_user_id()
    AND related_user_id = actor_id
    AND recipient_id <> actor_id
    AND EXISTS (
      SELECT 1
      FROM rewind.follows relationship
      WHERE relationship.follower_id = actor_id
        AND relationship.following_id = recipient_id
    )
  );
