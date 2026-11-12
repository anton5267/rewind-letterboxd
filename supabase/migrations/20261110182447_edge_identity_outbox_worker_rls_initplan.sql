-- Evaluate the transaction-local worker flag once per statement while keeping
-- the existing row- and write-level gate unchanged.
ALTER POLICY edge_app_identity_outbox_worker
  ON rewind.supabase_identity_deletion_outbox
  USING ((SELECT current_setting('rewind.identity_cleanup_worker', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.identity_cleanup_worker', TRUE)) = 'true');
