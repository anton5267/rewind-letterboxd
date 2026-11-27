-- Store a calendar date separately from when the member performed the action.
-- Existing rows remain NULL because their actual watch date cannot be inferred.
ALTER TABLE rewind.list_items
  ADD COLUMN watched_on DATE NULL;

GRANT UPDATE (watched_on) ON rewind.list_items TO rewind_edge_app;

COMMENT ON COLUMN rewind.list_items.watched_on IS
  'Member-selected local calendar day the film was watched; NULL means no date was provided.';
