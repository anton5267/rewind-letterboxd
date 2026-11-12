-- Keep FK maintenance bounded when users or moderators are deleted.
-- The existing OPEN-report uniqueness index is partial and ordered by review_id,
-- so it cannot cover the reporter_id foreign key or reviewed_by SET NULL check.
CREATE INDEX review_reports_reporter_id_idx
  ON rewind.review_reports (reporter_id);

CREATE INDEX review_reports_reviewed_by_idx
  ON rewind.review_reports (reviewed_by);
