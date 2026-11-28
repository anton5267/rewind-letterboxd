-- Allow a narrow authenticated self-service path to add a selected TMDB movie.
-- The Edge API must validate Auth, active REWIND profile, provider metadata,
-- daily quota, and set the transaction-local flag before writing catalog rows.

CREATE TABLE rewind.tmdb_user_imports (
  user_id BIGINT NOT NULL REFERENCES rewind.users(id) ON DELETE CASCADE,
  tmdb_id BIGINT NOT NULL CHECK (tmdb_id > 0),
  movie_id BIGINT NOT NULL REFERENCES rewind.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tmdb_user_imports_pkey PRIMARY KEY (user_id, tmdb_id)
);

CREATE INDEX tmdb_user_imports_user_created_idx
  ON rewind.tmdb_user_imports (user_id, created_at DESC);

ALTER TABLE rewind.tmdb_user_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY edge_app_tmdb_import_usage_select
  ON rewind.tmdb_user_imports FOR SELECT TO rewind_edge_app
  USING (user_id = NULLIF(current_setting('rewind.user_id', TRUE), '')::BIGINT);

CREATE POLICY edge_app_tmdb_import_usage_insert
  ON rewind.tmdb_user_imports FOR INSERT TO rewind_edge_app
  WITH CHECK (
    user_id = NULLIF(current_setting('rewind.user_id', TRUE), '')::BIGINT
    AND current_setting('rewind.tmdb_user_import', TRUE) = 'true'
  );

GRANT SELECT, INSERT ON rewind.tmdb_user_imports TO rewind_edge_app;

GRANT INSERT (tmdb_id, title, is_published),
  UPDATE (tmdb_id, imdb_id, original_language, title, duration_minutes, release_date,
          short_plot, photo_url, backdrop_url, trailer_url, updated_at)
  ON rewind.movies TO rewind_edge_app;

CREATE POLICY edge_app_tmdb_import_movie_insert
  ON rewind.movies FOR INSERT TO rewind_edge_app
  WITH CHECK (
    current_setting('rewind.tmdb_user_import', TRUE) = 'true'
    AND tmdb_id IS NOT NULL AND is_published = TRUE
  );

CREATE POLICY edge_app_tmdb_import_movie_update
  ON rewind.movies FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true' AND tmdb_id IS NOT NULL)
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true' AND tmdb_id IS NOT NULL);

CREATE POLICY edge_app_tmdb_import_genre_insert
  ON rewind.genres FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_genre_update
  ON rewind.genres FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');

CREATE POLICY edge_app_tmdb_import_actor_insert
  ON rewind.actors FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_actor_update
  ON rewind.actors FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');

CREATE POLICY edge_app_tmdb_import_director_insert
  ON rewind.directors FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_director_update
  ON rewind.directors FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');

CREATE POLICY edge_app_tmdb_import_producer_insert
  ON rewind.producers FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_producer_update
  ON rewind.producers FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');

CREATE POLICY edge_app_tmdb_import_movie_genres_insert
  ON rewind.movie_genres FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_genres_delete
  ON rewind.movie_genres FOR DELETE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_actors_insert
  ON rewind.movie_actors FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_actors_delete
  ON rewind.movie_actors FOR DELETE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_directors_insert
  ON rewind.movie_directors FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_directors_delete
  ON rewind.movie_directors FOR DELETE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_producers_insert
  ON rewind.movie_producers FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_movie_producers_delete
  ON rewind.movie_producers FOR DELETE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_similar_insert
  ON rewind.similar_movies FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_similar_delete
  ON rewind.similar_movies FOR DELETE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_external_rating_insert
  ON rewind.external_ratings FOR INSERT TO rewind_edge_app
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
CREATE POLICY edge_app_tmdb_import_external_rating_update
  ON rewind.external_ratings FOR UPDATE TO rewind_edge_app
  USING (current_setting('rewind.tmdb_user_import', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.tmdb_user_import', TRUE) = 'true');
