-- Let moderators dismiss false reports and keep an auditable resolution record.
ALTER TABLE rewind.review_reports
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'DISMISSED', 'ACTION_TAKEN')),
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by BIGINT REFERENCES rewind.users(id) ON DELETE SET NULL;

ALTER TABLE rewind.review_reports
  DROP CONSTRAINT review_reports_uq_review_reporter;

CREATE UNIQUE INDEX review_reports_uq_open_review_reporter
  ON rewind.review_reports(review_id, reporter_id)
  WHERE status = 'OPEN';

GRANT UPDATE (status, reviewed_at, reviewed_by) ON rewind.review_reports TO rewind_edge_app;

CREATE POLICY edge_app_review_report_update ON rewind.review_reports
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin())
  WITH CHECK (rewind.current_user_is_admin());
