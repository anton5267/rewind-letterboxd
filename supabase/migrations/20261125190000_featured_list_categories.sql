-- The approved Featured Lists screen groups the existing curated feed into
-- three editorial sections. Existing featured rows stay visible in the first
-- section until an administrator assigns them to another category.
ALTER TABLE rewind.lists
  ADD COLUMN featured_category TEXT;

UPDATE rewind.lists
SET featured_category = 'REWIND_COMMUNITY'
WHERE featured_position IS NOT NULL;

ALTER TABLE rewind.lists
  ADD CONSTRAINT lists_featured_category_valid
  CHECK (featured_category IS NULL OR featured_category IN (
    'REWIND_COMMUNITY',
    'OTHER_TOP_FILM_LISTS',
    'FILMMAKER_RECOMMENDATIONS'
  ));

GRANT UPDATE (featured_category) ON rewind.lists TO rewind_edge_app;
