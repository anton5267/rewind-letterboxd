-- Curated list discovery. The column stays in the private rewind schema and is
-- only writable by the Edge role after its ADMIN transaction/RLS checks.
ALTER TABLE rewind.lists
  ADD COLUMN featured_position INTEGER;

ALTER TABLE rewind.lists
  ADD CONSTRAINT lists_featured_position_nonnegative
  CHECK (featured_position IS NULL OR featured_position >= 0);

CREATE UNIQUE INDEX lists_featured_position_unique
  ON rewind.lists (featured_position)
  WHERE featured_position IS NOT NULL;

GRANT UPDATE (featured_position) ON rewind.lists TO rewind_edge_app;
