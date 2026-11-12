-- Cache the transaction-local worker flag once per statement instead of
-- evaluating current_setting for every candidate movie row.
ALTER POLICY edge_app_catalog_select ON rewind.movies
  USING (is_published OR rewind.current_user_is_admin()
    OR (SELECT current_setting('rewind.tmdb_refresh_worker', TRUE)) = 'true');
