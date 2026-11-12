-- Private worker state. Movies without a verified TMDB ID are never selected.
CREATE TABLE rewind.tmdb_refresh_state (
  movie_id BIGINT PRIMARY KEY REFERENCES rewind.movies(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  succeeded_at TIMESTAMPTZ,
  last_error_code VARCHAR(32),
  CONSTRAINT tmdb_refresh_state_error_code_ck
    CHECK (last_error_code IS NULL OR last_error_code IN ('TMDB_NOT_FOUND','TMDB_UNAVAILABLE','SYNC_FAILED'))
);

CREATE INDEX tmdb_refresh_state_attempted_idx
  ON rewind.tmdb_refresh_state (attempted_at, movie_id);

REVOKE ALL ON rewind.tmdb_refresh_state FROM PUBLIC, anon, authenticated, rewind_edge_reader;
GRANT SELECT, INSERT, UPDATE ON rewind.tmdb_refresh_state TO rewind_edge_app;

ALTER TABLE rewind.tmdb_refresh_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY edge_app_tmdb_refresh_worker
  ON rewind.tmdb_refresh_state FOR ALL TO rewind_edge_app
  USING ((SELECT current_setting('rewind.tmdb_refresh_worker', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_refresh_worker', TRUE)) = 'true');
