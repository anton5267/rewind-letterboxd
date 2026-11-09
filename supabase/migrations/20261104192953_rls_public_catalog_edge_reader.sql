-- Defense in depth for the private read-only catalogue schema.
-- anon/authenticated keep no schema or table grants; only the Edge Function's
-- NOLOGIN rewind_edge_reader role receives a SELECT policy.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'movies',
    'genres',
    'movie_genres',
    'actors',
    'movie_actors',
    'directors',
    'movie_directors',
    'external_ratings',
    'similar_movies'
  ]
  LOOP
    EXECUTE format('ALTER TABLE rewind.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON rewind.%I FOR SELECT TO rewind_edge_reader USING (true)',
      'edge_reader_catalog_select',
      table_name
    );
  END LOOP;
END
$$;
