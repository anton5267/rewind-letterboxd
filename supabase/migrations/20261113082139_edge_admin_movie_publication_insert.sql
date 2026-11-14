-- Admin movie creation writes is_published explicitly; grant only that column.
GRANT INSERT (is_published) ON rewind.movies TO rewind_edge_app;
