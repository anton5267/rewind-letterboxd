ALTER TABLE rewind.movies
  ADD COLUMN original_language VARCHAR(10);

GRANT INSERT (original_language) ON rewind.movies TO rewind_edge_app;
GRANT UPDATE (original_language) ON rewind.movies TO rewind_edge_app;
