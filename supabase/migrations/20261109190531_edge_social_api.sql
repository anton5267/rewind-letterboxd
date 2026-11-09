-- Public social reads and owner-scoped follow writes used by the REWIND Edge API.
-- The schema stays private to PostgREST; the Edge role is the only app role here.

GRANT SELECT (id, username, display_name, avatar_url, role, is_active, is_hq, supabase_user_id, created_at)
  ON rewind.users TO rewind_edge_app;
GRANT SELECT ON rewind.ratings, rewind.follows, rewind.user_activities,
  rewind.user_social_links, rewind.user_blocks, rewind.notification_preferences,
  rewind.notifications TO rewind_edge_app;
GRANT INSERT (follower_id, following_id), DELETE ON rewind.follows TO rewind_edge_app;
GRANT INSERT (user_id, activity_type, related_user_id) ON rewind.user_activities TO rewind_edge_app;
GRANT INSERT (recipient_id, actor_id, related_user_id, notification_type)
  ON rewind.notifications TO rewind_edge_app;
GRANT INSERT (blocker_id, blocked_id), DELETE ON rewind.user_blocks TO rewind_edge_app;
GRANT INSERT (user_id, platform, url), DELETE ON rewind.user_social_links TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.follows_id_seq, rewind.notifications_id_seq,
  rewind.user_activities_id_seq, rewind.user_blocks_id_seq,
  rewind.user_social_links_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_rating_active_user_read ON rewind.ratings
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

CREATE POLICY edge_app_review_public_read ON rewind.reviews
  FOR SELECT TO rewind_edge_app
  USING (NOT is_hidden AND EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

CREATE POLICY edge_app_list_public_profile_system_read ON rewind.lists
  FOR SELECT TO rewind_edge_app
  USING (list_type IN ('WATCHED','WATCHLIST','FAVORITES')
    AND EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

CREATE POLICY edge_app_list_item_public_profile_system_read ON rewind.list_items
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.lists l JOIN rewind.users u ON u.id = l.user_id
    WHERE l.id = list_id AND l.list_type IN ('WATCHED','WATCHLIST','FAVORITES') AND u.is_active));

CREATE POLICY edge_app_review_likes_public_read ON rewind.review_likes
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.reviews r JOIN rewind.users u ON u.id = r.user_id
    WHERE r.id = review_id AND NOT r.is_hidden AND u.is_active));

CREATE POLICY edge_app_follow_read_active ON rewind.follows
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users f JOIN rewind.users t ON t.id = following_id
    WHERE f.id = follower_id AND f.is_active AND t.is_active));

CREATE POLICY edge_app_follow_insert_owner ON rewind.follows
  FOR INSERT TO rewind_edge_app
  WITH CHECK (follower_id = rewind.current_rewind_user_id() AND follower_id <> following_id
    AND EXISTS (SELECT 1 FROM rewind.users target WHERE target.id = following_id AND target.is_active)
    AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
      WHERE (b.blocker_id = follower_id AND b.blocked_id = following_id)
         OR (b.blocker_id = following_id AND b.blocked_id = follower_id)));

CREATE POLICY edge_app_follow_delete_owner ON rewind.follows
  FOR DELETE TO rewind_edge_app USING (follower_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_follow_delete_when_blocking ON rewind.follows
  FOR DELETE TO rewind_edge_app USING (EXISTS (
    SELECT 1 FROM rewind.user_blocks b
    WHERE (b.blocker_id = rewind.current_rewind_user_id()
        AND ((follower_id = rewind.current_rewind_user_id() AND following_id = b.blocked_id)
          OR (following_id = rewind.current_rewind_user_id() AND follower_id = b.blocked_id)))
       OR (b.blocked_id = rewind.current_rewind_user_id()
        AND ((follower_id = rewind.current_rewind_user_id() AND following_id = b.blocker_id)
          OR (following_id = rewind.current_rewind_user_id() AND follower_id = b.blocker_id)))
  ));

CREATE POLICY edge_app_activity_active_read ON rewind.user_activities
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

CREATE POLICY edge_app_activity_follow_insert ON rewind.user_activities
  FOR INSERT TO rewind_edge_app
  WITH CHECK (user_id = rewind.current_rewind_user_id()
    AND (activity_type <> 'FOLLOW' OR EXISTS (SELECT 1 FROM rewind.users target
      WHERE target.id = related_user_id AND target.is_active)));

CREATE POLICY edge_app_social_links_active_read ON rewind.user_social_links
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

CREATE POLICY edge_app_social_links_owner_insert ON rewind.user_social_links
  FOR INSERT TO rewind_edge_app WITH CHECK (user_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_social_links_owner_delete ON rewind.user_social_links
  FOR DELETE TO rewind_edge_app USING (user_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_block_pair_read ON rewind.user_blocks
  FOR SELECT TO rewind_edge_app
  USING (blocker_id = rewind.current_rewind_user_id() OR blocked_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_block_insert_owner ON rewind.user_blocks
  FOR INSERT TO rewind_edge_app
  WITH CHECK (blocker_id = rewind.current_rewind_user_id() AND blocker_id <> blocked_id
    AND EXISTS (SELECT 1 FROM rewind.users target WHERE target.id = blocked_id AND target.is_active));
CREATE POLICY edge_app_block_delete_owner ON rewind.user_blocks
  FOR DELETE TO rewind_edge_app USING (blocker_id = rewind.current_rewind_user_id());

CREATE POLICY edge_app_notification_preference_follow_read ON rewind.notification_preferences
  FOR SELECT TO rewind_edge_app USING (TRUE);

CREATE POLICY edge_app_follow_notification_insert ON rewind.notifications
  FOR INSERT TO rewind_edge_app
  WITH CHECK (notification_type = 'FOLLOW' AND actor_id = rewind.current_rewind_user_id()
    AND related_user_id = actor_id AND recipient_id <> actor_id);
