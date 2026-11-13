-- Existing lists retain their numbered presentation. Toggling does not alter item positions.
ALTER TABLE rewind.lists ADD COLUMN is_ranked boolean NOT NULL DEFAULT true;

GRANT SELECT (is_ranked), INSERT (is_ranked), UPDATE (is_ranked)
    ON rewind.lists TO rewind_edge_app;
