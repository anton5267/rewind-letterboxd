-- Support reverse lookups from a director to the films they directed.
CREATE INDEX movie_directors_director_id_idx
  ON rewind.movie_directors (director_id);
