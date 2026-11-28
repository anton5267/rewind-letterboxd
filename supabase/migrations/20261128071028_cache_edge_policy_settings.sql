-- Evaluate transaction-local Edge API settings once per statement instead of
-- once per candidate row. The predicates and access rules are unchanged.
ALTER POLICY edge_app_profile_media_read ON rewind.profile_media_objects
  USING (
    (SELECT current_setting('rewind.media_cleanup_worker', TRUE)) = 'true'
    OR rewind.owns_profile_media(user_id, supabase_user_id)
  );
ALTER POLICY edge_app_profile_media_update ON rewind.profile_media_objects
  USING (
    (SELECT current_setting('rewind.media_cleanup_worker', TRUE)) = 'true'
    OR rewind.owns_profile_media(user_id, supabase_user_id)
  )
  WITH CHECK (
    (SELECT current_setting('rewind.media_cleanup_worker', TRUE)) = 'true'
    OR rewind.owns_profile_media(user_id, supabase_user_id)
  );
ALTER POLICY edge_app_profile_media_cleanup_delete ON rewind.profile_media_objects
  USING (
    (SELECT current_setting('rewind.media_cleanup_worker', TRUE)) = 'true'
    AND status = 'DELETE'
  );

ALTER POLICY edge_app_tmdb_import_usage_select ON rewind.tmdb_user_imports
  USING (user_id = NULLIF((SELECT current_setting('rewind.user_id', TRUE)), '')::BIGINT);
ALTER POLICY edge_app_tmdb_import_usage_insert ON rewind.tmdb_user_imports
  WITH CHECK (
    user_id = NULLIF((SELECT current_setting('rewind.user_id', TRUE)), '')::BIGINT
    AND (SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true'
  );

ALTER POLICY edge_app_tmdb_import_movie_insert ON rewind.movies
  WITH CHECK (
    (SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true'
    AND tmdb_id IS NOT NULL AND is_published = TRUE
  );
ALTER POLICY edge_app_tmdb_import_movie_update ON rewind.movies
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true' AND tmdb_id IS NOT NULL)
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true' AND tmdb_id IS NOT NULL);

ALTER POLICY edge_app_tmdb_import_genre_insert ON rewind.genres
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_genre_update ON rewind.genres
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');

ALTER POLICY edge_app_tmdb_import_actor_insert ON rewind.actors
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_actor_update ON rewind.actors
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');

ALTER POLICY edge_app_tmdb_import_director_insert ON rewind.directors
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_director_update ON rewind.directors
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');

ALTER POLICY edge_app_tmdb_import_producer_insert ON rewind.producers
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_producer_update ON rewind.producers
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');

ALTER POLICY edge_app_tmdb_import_movie_genres_insert ON rewind.movie_genres
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_genres_delete ON rewind.movie_genres
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_actors_insert ON rewind.movie_actors
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_actors_delete ON rewind.movie_actors
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_directors_insert ON rewind.movie_directors
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_directors_delete ON rewind.movie_directors
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_producers_insert ON rewind.movie_producers
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_movie_producers_delete ON rewind.movie_producers
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_similar_insert ON rewind.similar_movies
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_similar_delete ON rewind.similar_movies
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_external_rating_insert ON rewind.external_ratings
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
ALTER POLICY edge_app_tmdb_import_external_rating_update ON rewind.external_ratings
  USING ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true')
  WITH CHECK ((SELECT current_setting('rewind.tmdb_user_import', TRUE)) = 'true');
