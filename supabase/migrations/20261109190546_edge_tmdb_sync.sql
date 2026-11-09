-- Allow only the server-side application role to maintain TMDB catalog metadata.
-- Public readers keep SELECT-only policies; admin authorization is checked in the
-- Edge API and again through current_user_is_admin() row policies.
CREATE UNIQUE INDEX IF NOT EXISTS genres_tmdb_id_key ON rewind.genres (tmdb_id);
GRANT SELECT ON rewind.producers, rewind.movie_producers TO rewind_edge_reader, rewind_edge_app;
CREATE POLICY edge_reader_catalog_select ON rewind.producers FOR SELECT TO rewind_edge_reader USING (true);
CREATE POLICY edge_app_catalog_select ON rewind.producers FOR SELECT TO rewind_edge_app USING (true);
CREATE POLICY edge_reader_catalog_select ON rewind.movie_producers FOR SELECT TO rewind_edge_reader USING (true);
CREATE POLICY edge_app_catalog_select ON rewind.movie_producers FOR SELECT TO rewind_edge_app USING (true);

GRANT INSERT (name, tmdb_id) ON rewind.genres TO rewind_edge_app;
GRANT UPDATE (name, tmdb_id) ON rewind.genres TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.genres_id_seq TO rewind_edge_app;

GRANT INSERT (name, tmdb_id, photo_url) ON rewind.actors, rewind.directors, rewind.producers TO rewind_edge_app;
GRANT UPDATE (name, tmdb_id, photo_url) ON rewind.actors, rewind.directors, rewind.producers TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.actors_id_seq, rewind.directors_id_seq, rewind.producers_id_seq TO rewind_edge_app;

GRANT INSERT, DELETE ON rewind.movie_genres, rewind.movie_actors, rewind.movie_directors,
  rewind.movie_producers, rewind.similar_movies TO rewind_edge_app;
GRANT INSERT (movie_id, source, rating, votes_count, last_updated_at),
  UPDATE (rating, votes_count, last_updated_at) ON rewind.external_ratings TO rewind_edge_app;
GRANT UPDATE (tmdb_id) ON rewind.movies TO rewind_edge_app;

CREATE POLICY edge_app_admin_genre_insert ON rewind.genres FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_genre_update ON rewind.genres FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin()) WITH CHECK (rewind.current_user_is_admin());

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['actors','directors','producers'] LOOP
    EXECUTE format('CREATE POLICY edge_app_admin_%I_insert ON rewind.%I FOR INSERT TO rewind_edge_app WITH CHECK (rewind.current_user_is_admin())', table_name, table_name);
    EXECUTE format('CREATE POLICY edge_app_admin_%I_update ON rewind.%I FOR UPDATE TO rewind_edge_app USING (rewind.current_user_is_admin()) WITH CHECK (rewind.current_user_is_admin())', table_name, table_name);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['movie_genres','movie_actors','movie_directors','movie_producers','similar_movies'] LOOP
    EXECUTE format('CREATE POLICY edge_app_admin_%I_insert ON rewind.%I FOR INSERT TO rewind_edge_app WITH CHECK (rewind.current_user_is_admin())', table_name, table_name);
    EXECUTE format('CREATE POLICY edge_app_admin_%I_delete ON rewind.%I FOR DELETE TO rewind_edge_app USING (rewind.current_user_is_admin())', table_name, table_name);
  END LOOP;
END $$;

CREATE POLICY edge_app_admin_external_rating_insert ON rewind.external_ratings FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_external_rating_update ON rewind.external_ratings FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin()) WITH CHECK (rewind.current_user_is_admin());
