-- Public journal reads and per-profile newsletter subscription management.
-- Administration and delivery queue operations are added in a later slice.

CREATE OR REPLACE FUNCTION rewind.current_user_is_admin() RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, rewind
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id()
      AND admin.supabase_user_id = rewind.current_supabase_uid()
      AND admin.role = 'ADMIN' AND admin.is_active
  )
$$;
REVOKE ALL ON FUNCTION rewind.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rewind.current_user_is_admin() TO rewind_edge_app;

GRANT SELECT ON rewind.journal_articles TO rewind_edge_app;
GRANT SELECT ON rewind.newsletter_subscriptions TO rewind_edge_app;
GRANT INSERT (user_id, is_subscribed, subscribed_at),
  UPDATE (is_subscribed, subscribed_at, updated_at)
  ON rewind.newsletter_subscriptions TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.newsletter_subscriptions_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_published_journal_read ON rewind.journal_articles
  FOR SELECT TO rewind_edge_app
  USING (is_published = TRUE);

GRANT SELECT (role) ON rewind.users TO rewind_edge_app;
CREATE POLICY edge_app_admin_user_read ON rewind.users
  FOR SELECT TO rewind_edge_app
  USING (rewind.current_user_is_admin());
GRANT INSERT (slug, language, category, title, excerpt, content, cover_url, audio_url, is_published, published_at, author_id),
  UPDATE (slug, language, category, title, excerpt, content, cover_url, audio_url, is_published, published_at, updated_at)
  ON rewind.journal_articles TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.journal_articles_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_admin_journal_read ON rewind.journal_articles
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_journal_insert ON rewind.journal_articles
  FOR INSERT TO rewind_edge_app
  WITH CHECK (author_id = rewind.current_rewind_user_id()
    AND EXISTS (SELECT 1 FROM rewind.users admin
      WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_journal_update ON rewind.journal_articles
  FOR UPDATE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active))
  WITH CHECK (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

GRANT INSERT (admin_id, action, target_type, target_id, metadata) ON rewind.admin_audit_logs TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.admin_audit_logs_id_seq TO rewind_edge_app;
CREATE POLICY edge_app_admin_audit_insert ON rewind.admin_audit_logs
  FOR INSERT TO rewind_edge_app
  WITH CHECK (admin_id = rewind.current_rewind_user_id()
    AND EXISTS (SELECT 1 FROM rewind.users admin
      WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

GRANT UPDATE (is_hidden, moderated_reason, moderated_at, moderated_by) ON rewind.reviews, rewind.comments TO rewind_edge_app;
CREATE POLICY edge_app_admin_review_read ON rewind.reviews
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_review_update ON rewind.reviews
  FOR UPDATE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active))
  WITH CHECK (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_review_delete ON rewind.reviews
  FOR DELETE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

CREATE POLICY edge_app_admin_comment_read ON rewind.comments
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_comment_update ON rewind.comments
  FOR UPDATE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active))
  WITH CHECK (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

GRANT INSERT (recipient_id, actor_id, related_user_id, review_id, notification_type), DELETE
  ON rewind.notifications TO rewind_edge_app;
GRANT UPDATE (read_at) ON rewind.notifications TO rewind_edge_app;
CREATE POLICY edge_app_admin_notification_read ON rewind.notifications
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_notification_insert ON rewind.notifications
  FOR INSERT TO rewind_edge_app
  WITH CHECK (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_notification_update ON rewind.notifications
  FOR UPDATE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active))
  WITH CHECK (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_notification_delete ON rewind.notifications
  FOR DELETE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

GRANT DELETE ON rewind.conversations TO rewind_edge_app;
CREATE POLICY edge_app_admin_conversation_read ON rewind.conversations
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_conversation_delete ON rewind.conversations
  FOR DELETE TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));
CREATE POLICY edge_app_admin_message_read ON rewind.messages
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.users admin
    WHERE admin.id = rewind.current_rewind_user_id() AND admin.role = 'ADMIN' AND admin.is_active));

CREATE POLICY edge_app_newsletter_subscription_owner_read ON rewind.newsletter_subscriptions
  FOR SELECT TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_newsletter_subscription_owner_insert ON rewind.newsletter_subscriptions
  FOR INSERT TO rewind_edge_app
  WITH CHECK (user_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_newsletter_subscription_owner_update ON rewind.newsletter_subscriptions
  FOR UPDATE TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id())
  WITH CHECK (user_id = rewind.current_rewind_user_id());
