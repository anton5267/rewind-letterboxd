-- Keep the existing catalogue public while allowing Admins to hide future records.
ALTER TABLE rewind.movies
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE;

GRANT UPDATE (is_published) ON rewind.movies TO rewind_edge_app;

DROP POLICY edge_app_catalog_select ON rewind.movies;
CREATE POLICY edge_app_catalog_select ON rewind.movies
  FOR SELECT TO rewind_edge_app
  USING (is_published OR rewind.current_user_is_admin()
    OR current_setting('rewind.tmdb_refresh_worker', TRUE) = 'true');

DROP POLICY edge_reader_catalog_select ON rewind.movies;
CREATE POLICY edge_reader_catalog_select ON rewind.movies
  FOR SELECT TO rewind_edge_reader
  USING (is_published);
