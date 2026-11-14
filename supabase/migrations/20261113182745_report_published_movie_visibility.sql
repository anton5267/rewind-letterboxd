-- Keep report eligibility aligned with public review/comment visibility.
-- Hidden movies must not be reportable through guessed IDs or lower-level SQL.

DROP POLICY edge_app_review_report_insert ON rewind.review_reports;
CREATE POLICY edge_app_review_report_insert ON rewind.review_reports
  FOR INSERT TO rewind_edge_app
  WITH CHECK (
    reporter_id = rewind.current_rewind_user_id()
    AND EXISTS (
      SELECT 1 FROM rewind.reviews r
      JOIN rewind.users author ON author.id = r.user_id
      JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
      WHERE r.id = review_reports.review_id
        AND r.user_id <> rewind.current_rewind_user_id()
        AND r.is_hidden = FALSE
        AND author.is_active = TRUE
    )
  );

DROP POLICY edge_app_comment_report_insert ON rewind.comment_reports;
CREATE POLICY edge_app_comment_report_insert ON rewind.comment_reports
  FOR INSERT TO rewind_edge_app
  WITH CHECK (
    reporter_id = rewind.current_rewind_user_id()
    AND EXISTS (
      SELECT 1 FROM rewind.comments c
      JOIN rewind.reviews r ON r.id = c.review_id
      JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
      JOIN rewind.users comment_author ON comment_author.id = c.user_id
      JOIN rewind.users review_author ON review_author.id = r.user_id
      WHERE c.id = comment_reports.comment_id
        AND c.user_id <> rewind.current_rewind_user_id()
        AND c.is_hidden = FALSE
        AND r.is_hidden = FALSE
        AND comment_author.is_active = TRUE
        AND review_author.is_active = TRUE
    )
  );
