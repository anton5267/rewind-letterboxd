ALTER TABLE rewind.lists
  ADD COLUMN published_at TIMESTAMPTZ;

-- Exact historical publication transitions were not recorded before this
-- migration. Use list creation time as the only available estimate.
UPDATE rewind.lists
SET published_at = created_at
WHERE is_public = TRUE;

CREATE FUNCTION rewind.set_list_publication_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, rewind
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.published_at := CASE
      WHEN NEW.is_public THEN COALESCE(NEW.published_at, NEW.created_at, CURRENT_TIMESTAMP)
      ELSE NULL
    END;
  ELSIF NEW.is_public IS DISTINCT FROM OLD.is_public THEN
    NEW.published_at := CASE WHEN NEW.is_public THEN CURRENT_TIMESTAMP ELSE NULL END;
  ELSIF NOT NEW.is_public THEN
    NEW.published_at := NULL;
  ELSE
    NEW.published_at := OLD.published_at;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION rewind.set_list_publication_timestamp() FROM PUBLIC;

CREATE TRIGGER lists_publication_timestamp
BEFORE INSERT OR UPDATE OF is_public ON rewind.lists
FOR EACH ROW EXECUTE FUNCTION rewind.set_list_publication_timestamp();

ALTER TABLE rewind.lists
  ADD CONSTRAINT lists_publication_timestamp_consistent
  CHECK (is_public = (published_at IS NOT NULL));
