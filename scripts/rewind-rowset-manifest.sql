SET TIME ZONE 'UTC';
SET DateStyle = 'ISO, YMD';
SET IntervalStyle = 'postgres';
SET extra_float_digits = 3;

CREATE TEMP TABLE rewind_backup_manifest (
  table_schema text NOT NULL,
  table_name text NOT NULL,
  row_count bigint NOT NULL,
  row_hash text NOT NULL
);

DO $manifest$
DECLARE
  item record;
  item_count bigint;
  item_hash text;
BEGIN
  FOR item IN
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables AS t
    WHERE t.table_schema = 'rewind' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_schema, t.table_name
  LOOP
    EXECUTE format(
      'SELECT count(*)::bigint, md5(COALESCE(string_agg(md5(to_jsonb(row_value)::text), %L ORDER BY to_jsonb(row_value)::text COLLATE "C"), %L)) FROM %I.%I AS row_value',
      '', '', item.table_schema, item.table_name
    )
    INTO item_count, item_hash;

    INSERT INTO pg_temp.rewind_backup_manifest
      (table_schema, table_name, row_count, row_hash)
    VALUES (item.table_schema, item.table_name, item_count, item_hash);
  END LOOP;
END;
$manifest$;

SELECT table_schema, table_name, row_count, row_hash
FROM pg_temp.rewind_backup_manifest
ORDER BY table_schema, table_name;
