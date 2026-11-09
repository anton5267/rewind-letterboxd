-- Rating mutations are executed only by the authenticated Edge Function role.
-- Row ownership is derived from the server-verified REWIND profile ID.
GRANT SELECT, INSERT ON rewind.user_activities TO rewind_edge_app;
GRANT USAGE, SELECT ON SEQUENCE rewind.user_activities_id_seq TO rewind_edge_app;

CREATE POLICY edge_app_activity_owner_read ON rewind.user_activities
  FOR SELECT TO rewind_edge_app
  USING (user_id = rewind.current_rewind_user_id());
CREATE POLICY edge_app_activity_owner_insert ON rewind.user_activities
  FOR INSERT TO rewind_edge_app
  WITH CHECK (user_id = rewind.current_rewind_user_id());

CREATE OR REPLACE FUNCTION rewind.recalc_movie_community_rating() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rewind
AS $$
DECLARE
  target_movie_id BIGINT;
BEGIN
  target_movie_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.movie_id ELSE NEW.movie_id END;
  UPDATE rewind.movies
  SET rating = (
    SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(AVG(r.rating)::numeric, 1) END
    FROM rewind.ratings r WHERE r.movie_id = target_movie_id
  )
  WHERE id = target_movie_id;

  IF TG_OP = 'UPDATE' AND OLD.movie_id IS DISTINCT FROM NEW.movie_id THEN
    UPDATE rewind.movies
    SET rating = (
      SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(AVG(r.rating)::numeric, 1) END
      FROM rewind.ratings r WHERE r.movie_id = OLD.movie_id
    )
    WHERE id = OLD.movie_id;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION rewind.recalc_movie_community_rating() FROM PUBLIC;
CREATE TRIGGER ratings_recalc_movie_community_rating
  AFTER INSERT OR UPDATE OR DELETE ON rewind.ratings
  FOR EACH ROW EXECUTE FUNCTION rewind.recalc_movie_community_rating();
