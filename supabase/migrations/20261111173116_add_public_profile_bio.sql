-- Public profile bio is read through the private Edge API and editable by the
-- owning account. Do not expose the rewind schema through the Data API.
ALTER TABLE rewind.users ADD COLUMN bio VARCHAR(500);
GRANT SELECT (bio), UPDATE (bio) ON rewind.users TO rewind_edge_app;
