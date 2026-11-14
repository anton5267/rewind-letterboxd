CREATE TABLE rewind.profile_details (
    user_id BIGINT PRIMARY KEY REFERENCES rewind.users(id) ON DELETE CASCADE,
    given_name VARCHAR(80),
    family_name VARCHAR(80)
);

ALTER TABLE rewind.profile_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rewind.profile_details FROM PUBLIC, anon, authenticated, rewind_edge_reader, rewind_edge_app;
GRANT SELECT, INSERT ON rewind.profile_details TO rewind_edge_app;
GRANT UPDATE (given_name, family_name) ON rewind.profile_details TO rewind_edge_app;

CREATE POLICY edge_app_profile_details_owner ON rewind.profile_details
    FOR ALL TO rewind_edge_app
    USING (
        user_id = (SELECT rewind.current_rewind_user_id())
        AND EXISTS (
            SELECT 1 FROM rewind.users owner
            WHERE owner.id = rewind.profile_details.user_id AND owner.is_active
                AND owner.supabase_user_id = (SELECT rewind.current_supabase_uid())
        )
    )
    WITH CHECK (
        user_id = (SELECT rewind.current_rewind_user_id())
        AND EXISTS (
            SELECT 1 FROM rewind.users owner
            WHERE owner.id = rewind.profile_details.user_id AND owner.is_active
                AND owner.supabase_user_id = (SELECT rewind.current_supabase_uid())
        )
    );
