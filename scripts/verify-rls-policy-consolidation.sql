-- Run after all migrations in the clean Supabase replay. The Edge role should
-- have at most one permissive policy per table and command; PostgreSQL OR
-- composition is preserved by the consolidation migration.
DO $assertions$
DECLARE
  duplicate_groups TEXT;
BEGIN
  WITH duplicate_policy_groups AS (
    SELECT n.nspname, c.relname, p.polcmd, count(*) AS policy_count
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = ANY(p.polroles)
    WHERE n.nspname = 'rewind'
      AND r.rolname = 'rewind_edge_app'
      AND p.polpermissive
      AND p.polcmd IN ('r', 'a', 'w', 'd')
    GROUP BY c.oid, n.nspname, c.relname, p.polcmd
    HAVING count(*) > 1
  )
  SELECT string_agg(
    format('%I.%I command %s (%s policies)', nspname, relname, polcmd, policy_count),
    ', ' ORDER BY nspname, relname, polcmd
  )
  INTO duplicate_groups
  FROM duplicate_policy_groups;

  IF duplicate_groups IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate permissive Edge policies remain: %', duplicate_groups;
  END IF;
END
$assertions$;
