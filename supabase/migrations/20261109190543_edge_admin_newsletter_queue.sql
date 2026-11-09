-- Queue published newsletter articles and expose delivery counters to admins.
GRANT SELECT ON rewind.newsletter_deliveries TO rewind_edge_app;
GRANT INSERT (article_id, user_id) ON rewind.newsletter_deliveries TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.newsletter_deliveries_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_admin_newsletter_subscription_read ON rewind.newsletter_subscriptions
  FOR SELECT TO rewind_edge_app
  USING (rewind.current_user_is_admin());

CREATE POLICY edge_app_admin_newsletter_delivery_read ON rewind.newsletter_deliveries
  FOR SELECT TO rewind_edge_app
  USING (rewind.current_user_is_admin());

CREATE POLICY edge_app_admin_newsletter_delivery_insert ON rewind.newsletter_deliveries
  FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_user_is_admin());
