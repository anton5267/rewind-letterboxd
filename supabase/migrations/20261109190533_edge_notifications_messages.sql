-- Notifications and direct messages remain private to their recipient/members.
-- The Edge Function owns all authorization and derives numeric IDs from the
-- verified Supabase UUID; browser roles receive no schema/table access.

GRANT SELECT, UPDATE (read_at) ON rewind.notifications TO rewind_edge_app;
GRANT SELECT, INSERT (user_id, follows_enabled, review_likes_enabled), UPDATE (follows_enabled, review_likes_enabled, updated_at)
  ON rewind.notification_preferences TO rewind_edge_app;
GRANT SELECT, INSERT (user_one_id, user_two_id), UPDATE (updated_at)
  ON rewind.conversations TO rewind_edge_app;
GRANT SELECT ON rewind.messages TO rewind_edge_app;
GRANT INSERT (conversation_id, sender_id, body), UPDATE (read_at)
  ON rewind.messages TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.conversations_id_seq, rewind.messages_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_notification_owner_read ON rewind.notifications
  FOR SELECT TO rewind_edge_app
  USING (recipient_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_notification_owner_update ON rewind.notifications
  FOR UPDATE TO rewind_edge_app
  USING (recipient_id = rewind.current_rewind_user_id())
  WITH CHECK (recipient_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_notification_preference_owner_insert ON rewind.notification_preferences
  FOR INSERT TO rewind_edge_app
  WITH CHECK (user_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_notification_preference_owner_update ON rewind.notification_preferences
  FOR UPDATE TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id())
  WITH CHECK (user_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_conversation_member_read ON rewind.conversations
  FOR SELECT TO rewind_edge_app
  USING (rewind.current_rewind_user_id() IN (user_one_id, user_two_id)
    AND EXISTS (SELECT 1 FROM rewind.users other
      WHERE other.id = CASE WHEN user_one_id = rewind.current_rewind_user_id() THEN user_two_id ELSE user_one_id END
        AND other.is_active));
CREATE POLICY edge_app_conversation_member_insert ON rewind.conversations
  FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_rewind_user_id() IN (user_one_id, user_two_id)
    AND user_one_id < user_two_id
    AND EXISTS (SELECT 1 FROM rewind.users other
      WHERE other.id = CASE WHEN user_one_id = rewind.current_rewind_user_id() THEN user_two_id ELSE user_one_id END
        AND other.is_active)
    AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
      WHERE (b.blocker_id = user_one_id AND b.blocked_id = user_two_id)
         OR (b.blocker_id = user_two_id AND b.blocked_id = user_one_id)));
CREATE POLICY edge_app_conversation_member_update ON rewind.conversations
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_rewind_user_id() IN (user_one_id, user_two_id))
  WITH CHECK (rewind.current_rewind_user_id() IN (user_one_id, user_two_id));

CREATE POLICY edge_app_message_member_read ON rewind.messages
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.conversations c
    WHERE c.id = conversation_id AND rewind.current_rewind_user_id() IN (c.user_one_id, c.user_two_id)));
CREATE POLICY edge_app_message_member_insert ON rewind.messages
  FOR INSERT TO rewind_edge_app
  WITH CHECK (sender_id = rewind.current_rewind_user_id()
    AND EXISTS (SELECT 1 FROM rewind.conversations c
      WHERE c.id = conversation_id AND rewind.current_rewind_user_id() IN (c.user_one_id, c.user_two_id)
        AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
          WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
             OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id))));
CREATE POLICY edge_app_message_recipient_read_update ON rewind.messages
  FOR UPDATE TO rewind_edge_app
  USING (sender_id <> rewind.current_rewind_user_id()
    AND EXISTS (SELECT 1 FROM rewind.conversations c
      WHERE c.id = conversation_id AND rewind.current_rewind_user_id() IN (c.user_one_id, c.user_two_id)))
  WITH CHECK (sender_id <> rewind.current_rewind_user_id()
    AND EXISTS (SELECT 1 FROM rewind.conversations c
      WHERE c.id = conversation_id AND rewind.current_rewind_user_id() IN (c.user_one_id, c.user_two_id)));
