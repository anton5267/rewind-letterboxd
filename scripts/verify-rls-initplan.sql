-- CI guard for the exact policy expressions optimized by
-- 20261128120000_cache_edge_policy_settings.sql. Run after a clean migration
-- replay with `supabase db query --file scripts/verify-rls-initplan.sql`.
DO $assertions$
DECLARE
  expected_policy_count CONSTANT INTEGER := 27;
  actual_policy_count INTEGER;
  unoptimized_policies TEXT;
BEGIN
  WITH expected_policies(table_name, policy_name) AS (
    VALUES
      ('profile_media_objects', 'edge_app_profile_media_read'),
      ('profile_media_objects', 'edge_app_profile_media_update'),
      ('profile_media_objects', 'edge_app_profile_media_cleanup_delete'),
      ('tmdb_user_imports', 'edge_app_tmdb_import_usage_select'),
      ('tmdb_user_imports', 'edge_app_tmdb_import_usage_insert'),
      ('movies', 'edge_app_tmdb_import_movie_insert'),
      ('movies', 'edge_app_tmdb_import_movie_update'),
      ('genres', 'edge_app_tmdb_import_genre_insert'),
      ('genres', 'edge_app_tmdb_import_genre_update'),
      ('actors', 'edge_app_tmdb_import_actor_insert'),
      ('actors', 'edge_app_tmdb_import_actor_update'),
      ('directors', 'edge_app_tmdb_import_director_insert'),
      ('directors', 'edge_app_tmdb_import_director_update'),
      ('producers', 'edge_app_tmdb_import_producer_insert'),
      ('producers', 'edge_app_tmdb_import_producer_update'),
      ('movie_genres', 'edge_app_tmdb_import_movie_genres_insert'),
      ('movie_genres', 'edge_app_tmdb_import_movie_genres_delete'),
      ('movie_actors', 'edge_app_tmdb_import_movie_actors_insert'),
      ('movie_actors', 'edge_app_tmdb_import_movie_actors_delete'),
      ('movie_directors', 'edge_app_tmdb_import_movie_directors_insert'),
      ('movie_directors', 'edge_app_tmdb_import_movie_directors_delete'),
      ('movie_producers', 'edge_app_tmdb_import_movie_producers_insert'),
      ('movie_producers', 'edge_app_tmdb_import_movie_producers_delete'),
      ('similar_movies', 'edge_app_tmdb_import_similar_insert'),
      ('similar_movies', 'edge_app_tmdb_import_similar_delete'),
      ('external_ratings', 'edge_app_tmdb_import_external_rating_insert'),
      ('external_ratings', 'edge_app_tmdb_import_external_rating_update')
  ), actual_policies AS (
    SELECT expected.table_name, expected.policy_name,
      policy.qual AS using_expression,
      policy.with_check AS check_expression
    FROM expected_policies expected
    LEFT JOIN pg_policies policy
      ON policy.schemaname = 'rewind'
      AND policy.tablename = expected.table_name
      AND policy.policyname = expected.policy_name
      AND policy.roles = ARRAY['rewind_edge_app']::name[]
  )
  SELECT count(*) FILTER (WHERE using_expression IS NOT NULL OR check_expression IS NOT NULL),
    string_agg(format('%I.%I', table_name, policy_name), ', ' ORDER BY table_name, policy_name)
      FILTER (
        WHERE regexp_replace(coalesce(using_expression, ''),
          '\(\s*SELECT\s+current_setting\([^)]*\)\s+AS\s+current_setting\s*\)', '', 'gi') ~ 'current_setting\s*\('
          OR regexp_replace(coalesce(check_expression, ''),
          '\(\s*SELECT\s+current_setting\([^)]*\)\s+AS\s+current_setting\s*\)', '', 'gi') ~ 'current_setting\s*\('
      )
  INTO actual_policy_count, unoptimized_policies
  FROM actual_policies;

  IF actual_policy_count <> expected_policy_count THEN
    RAISE EXCEPTION 'Expected % optimized Edge policies, found %',
      expected_policy_count, actual_policy_count;
  END IF;

  IF unoptimized_policies IS NOT NULL THEN
    RAISE EXCEPTION 'Unwrapped current_setting remains in policies: %',
      unoptimized_policies;
  END IF;
END
$assertions$;
