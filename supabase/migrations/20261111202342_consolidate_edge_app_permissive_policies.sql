-- Preserve existing access exactly while reducing repeated permissive policy
-- evaluation for the private Edge API role. PostgreSQL OR-composes permissive
-- policies, so each merged expression is the OR of the original expressions.
DO $migration$
DECLARE
  edge_app_role oid;
  policy_group record;
  kept_policy name;
  merged_using text;
  merged_check text;
  old_policy record;
  new_policy name;
  command_name text;
  schema_name name;
  table_name name;
BEGIN
  SELECT oid INTO STRICT edge_app_role
  FROM pg_roles
  WHERE rolname = 'rewind_edge_app';

  FOR policy_group IN
    SELECT p.polrelid, p.polcmd
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'rewind'
      AND p.polroles = ARRAY[edge_app_role]
      AND p.polpermissive
      AND p.polcmd IN ('r', 'a', 'w', 'd')
    GROUP BY p.polrelid, p.polcmd
    HAVING count(*) > 1
    ORDER BY p.polrelid, p.polcmd
  LOOP
    SELECT n.nspname, c.relname
    INTO STRICT schema_name, table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.oid = policy_group.polrelid;

    SELECT
      min(p.polname),
      string_agg(format('(%s)', pg_get_expr(p.polqual, p.polrelid)), ' OR ' ORDER BY p.polname),
      string_agg(format('(%s)', pg_get_expr(p.polwithcheck, p.polrelid)), ' OR ' ORDER BY p.polname)
    INTO kept_policy, merged_using, merged_check
    FROM pg_policy p
    WHERE p.polrelid = policy_group.polrelid
      AND p.polcmd = policy_group.polcmd
      AND p.polroles = ARRAY[edge_app_role]
      AND p.polpermissive;

    IF policy_group.polcmd IN ('r', 'w', 'd') AND merged_using IS NULL THEN
      RAISE EXCEPTION 'Expected USING predicates for %.% policy command %', schema_name, table_name, policy_group.polcmd;
    END IF;
    IF policy_group.polcmd IN ('a', 'w') AND merged_check IS NULL THEN
      RAISE EXCEPTION 'Expected WITH CHECK predicates for %.% policy command %', schema_name, table_name, policy_group.polcmd;
    END IF;

    FOR old_policy IN
      SELECT p.polname
      FROM pg_policy p
      WHERE p.polrelid = policy_group.polrelid
        AND p.polcmd = policy_group.polcmd
        AND p.polroles = ARRAY[edge_app_role]
        AND p.polpermissive
        AND p.polname <> kept_policy
    LOOP
      EXECUTE format('DROP POLICY %I ON %I.%I', old_policy.polname, schema_name, table_name);
    END LOOP;

    command_name := CASE policy_group.polcmd
      WHEN 'r' THEN 'select'
      WHEN 'a' THEN 'insert'
      WHEN 'w' THEN 'update'
      WHEN 'd' THEN 'delete'
    END;
    new_policy := format('edge_app_%s_%s_combined', table_name, command_name);

    IF policy_group.polcmd = 'a' THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', kept_policy, schema_name, table_name, merged_check);
    ELSIF policy_group.polcmd = 'r' OR policy_group.polcmd = 'd' THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', kept_policy, schema_name, table_name, merged_using);
    ELSE
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        kept_policy, schema_name, table_name, merged_using, merged_check
      );
    END IF;

    IF new_policy <> kept_policy THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', kept_policy, schema_name, table_name, new_policy);
    END IF;
  END LOOP;
END
$migration$;
