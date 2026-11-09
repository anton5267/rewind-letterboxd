-- Grant catalog mutation only to the server-side Edge role.
GRANT INSERT (imdb_id, title, duration_minutes, release_date, age_rating, rating, short_plot,
              photo_url, backdrop_url, trailer_url)
  ON rewind.movies TO rewind_edge_app;
GRANT UPDATE (imdb_id, title, duration_minutes, release_date, age_rating, rating, short_plot,
              photo_url, backdrop_url, trailer_url, updated_at)
  ON rewind.movies TO rewind_edge_app;
GRANT DELETE ON rewind.movies TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.movies_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_admin_movie_insert ON rewind.movies
  FOR INSERT TO rewind_edge_app
  WITH CHECK (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_movie_update ON rewind.movies
  FOR UPDATE TO rewind_edge_app
  USING (rewind.current_user_is_admin())
  WITH CHECK (rewind.current_user_is_admin());
CREATE POLICY edge_app_admin_movie_delete ON rewind.movies
  FOR DELETE TO rewind_edge_app
  USING (rewind.current_user_is_admin());
