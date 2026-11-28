-- Support joins and cascading deletes through the imported movie foreign key.
CREATE INDEX tmdb_user_imports_movie_id_idx
  ON rewind.tmdb_user_imports (movie_id);
