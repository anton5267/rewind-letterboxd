CREATE TABLE rewind.profile_pinned_lists (
    user_id BIGINT PRIMARY KEY REFERENCES rewind.users(id) ON DELETE CASCADE,
    list_id BIGINT NOT NULL REFERENCES rewind.lists(id) ON DELETE CASCADE
);
CREATE INDEX profile_pinned_lists_target ON rewind.profile_pinned_lists(list_id);
ALTER TABLE rewind.profile_pinned_lists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rewind.profile_pinned_lists FROM PUBLIC, anon, authenticated, rewind_edge_reader, rewind_edge_app;
GRANT SELECT, DELETE ON rewind.profile_pinned_lists TO rewind_edge_app;
GRANT INSERT (user_id, list_id), UPDATE (list_id) ON rewind.profile_pinned_lists TO rewind_edge_app;

CREATE FUNCTION rewind.owns_profile_pin(target_user_id BIGINT) RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = pg_catalog, rewind AS $$
    SELECT target_user_id = (SELECT rewind.current_rewind_user_id())
        AND EXISTS (
            SELECT 1 FROM rewind.users u WHERE u.id = target_user_id AND u.is_active
                AND u.supabase_user_id = (SELECT rewind.current_supabase_uid())
        );
$$;
REVOKE ALL ON FUNCTION rewind.owns_profile_pin(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rewind.owns_profile_pin(BIGINT) TO rewind_edge_app;

CREATE POLICY edge_app_profile_pin_read ON rewind.profile_pinned_lists
    FOR SELECT TO rewind_edge_app USING (
        rewind.owns_profile_pin(user_id) OR (SELECT rewind.current_user_is_admin()) OR EXISTS (
            SELECT 1 FROM rewind.lists l JOIN rewind.users u ON u.id = l.user_id
            WHERE l.id = list_id AND l.user_id = profile_pinned_lists.user_id
                AND l.list_type = 'CUSTOM' AND l.is_public AND u.is_active
        )
    );
CREATE POLICY edge_app_profile_pin_insert ON rewind.profile_pinned_lists
    FOR INSERT TO rewind_edge_app WITH CHECK (
        rewind.owns_profile_pin(user_id) AND EXISTS (
            SELECT 1 FROM rewind.lists l WHERE l.id = list_id AND l.user_id = profile_pinned_lists.user_id
                AND l.list_type = 'CUSTOM' AND l.is_public
        )
    );
CREATE POLICY edge_app_profile_pin_update ON rewind.profile_pinned_lists
    FOR UPDATE TO rewind_edge_app USING (rewind.owns_profile_pin(user_id)) WITH CHECK (
        rewind.owns_profile_pin(user_id) AND EXISTS (
            SELECT 1 FROM rewind.lists l WHERE l.id = list_id AND l.user_id = profile_pinned_lists.user_id
                AND l.list_type = 'CUSTOM' AND l.is_public
        )
    );
CREATE POLICY edge_app_profile_pin_delete ON rewind.profile_pinned_lists
    FOR DELETE TO rewind_edge_app USING (
        rewind.owns_profile_pin(user_id) OR (SELECT rewind.current_user_is_admin())
    );

CREATE FUNCTION rewind.clear_unavailable_profile_pin() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, rewind AS $$
BEGIN
    DELETE FROM rewind.profile_pinned_lists WHERE list_id = NEW.id AND (
        user_id <> NEW.user_id OR NEW.list_type <> 'CUSTOM' OR NOT NEW.is_public
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER clear_unavailable_profile_pin AFTER UPDATE OF user_id, list_type, is_public ON rewind.lists
FOR EACH ROW EXECUTE FUNCTION rewind.clear_unavailable_profile_pin();
REVOKE ALL ON FUNCTION rewind.clear_unavailable_profile_pin() FROM PUBLIC;
