-- Permissive INSERT policies combine with OR. Keep the owner constraint and
-- the stricter FOLLOW-target check in one policy so the latter cannot be
-- bypassed by a second owner-only policy.
DROP POLICY IF EXISTS edge_app_activity_owner_insert ON rewind.user_activities;
DROP POLICY IF EXISTS edge_app_activity_follow_insert ON rewind.user_activities;

CREATE POLICY edge_app_activity_owner_insert ON rewind.user_activities
  FOR INSERT TO rewind_edge_app
  WITH CHECK (
    user_id = rewind.current_rewind_user_id()
    AND (
      activity_type <> 'FOLLOW'
      OR EXISTS (
        SELECT 1
        FROM rewind.users target
        WHERE target.id = related_user_id
          AND target.is_active
      )
    )
  );
