INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rewind-profile-media', 'rewind-profile-media', TRUE, 2097152, ARRAY['image/jpeg', 'image/png']);

ALTER TABLE rewind.users ADD COLUMN banner_url VARCHAR(255);
GRANT SELECT (banner_url), INSERT (banner_url), UPDATE (banner_url) ON rewind.users TO rewind_edge_app;

CREATE TABLE rewind.profile_media_objects (
    object_path VARCHAR(200) PRIMARY KEY,
    user_id BIGINT REFERENCES rewind.users(id) ON DELETE SET NULL,
    supabase_user_id VARCHAR(36) NOT NULL,
    kind VARCHAR(6) NOT NULL CHECK (kind IN ('avatar', 'banner')),
    public_url VARCHAR(255) NOT NULL,
    status VARCHAR(7) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DELETE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 minutes',
    locked_until TIMESTAMPTZ,
    lock_token UUID,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_http_status SMALLINT,
    CONSTRAINT media_detached_only_for_cleanup CHECK (user_id IS NOT NULL OR status = 'DELETE'),
    CONSTRAINT media_path_owner CHECK (user_id IS NULL OR object_path LIKE user_id::text || '/' || kind || '/%'),
    CONSTRAINT media_path_format CHECK (object_path ~* '^[1-9][0-9]*/(avatar|banner)/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png)$')
);

CREATE UNIQUE INDEX profile_media_active_kind ON rewind.profile_media_objects(user_id, kind) WHERE status = 'ACTIVE';
CREATE INDEX profile_media_pending_owner ON rewind.profile_media_objects(user_id) WHERE status = 'PENDING';
CREATE INDEX profile_media_cleanup_due ON rewind.profile_media_objects(next_attempt_at, object_path) WHERE status <> 'ACTIVE';

ALTER TABLE rewind.profile_media_objects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rewind.profile_media_objects FROM PUBLIC, anon, authenticated, rewind_edge_reader, rewind_edge_app;
GRANT SELECT, DELETE ON rewind.profile_media_objects TO rewind_edge_app;
GRANT INSERT (object_path, user_id, supabase_user_id, kind, public_url) ON rewind.profile_media_objects TO rewind_edge_app;
GRANT UPDATE (status, next_attempt_at, locked_until, lock_token, attempts, last_http_status) ON rewind.profile_media_objects TO rewind_edge_app;

CREATE FUNCTION rewind.owns_profile_media(target_user_id BIGINT, target_supabase_user_id TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = pg_catalog, rewind AS $$
    SELECT target_user_id = (SELECT rewind.current_rewind_user_id())
        AND target_supabase_user_id = (SELECT rewind.current_supabase_uid())
        AND EXISTS (
            SELECT 1 FROM rewind.users owner WHERE owner.id = target_user_id
                AND owner.supabase_user_id = target_supabase_user_id AND owner.is_active
        );
$$;
REVOKE ALL ON FUNCTION rewind.owns_profile_media(BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rewind.owns_profile_media(BIGINT, TEXT) TO rewind_edge_app;

CREATE POLICY edge_app_profile_media_read ON rewind.profile_media_objects
    FOR SELECT TO rewind_edge_app USING (
        current_setting('rewind.media_cleanup_worker', TRUE) = 'true'
        OR rewind.owns_profile_media(user_id, supabase_user_id)
    );
CREATE POLICY edge_app_profile_media_insert ON rewind.profile_media_objects
    FOR INSERT TO rewind_edge_app WITH CHECK (
        rewind.owns_profile_media(user_id, supabase_user_id) AND status = 'PENDING'
    );
CREATE POLICY edge_app_profile_media_update ON rewind.profile_media_objects
    FOR UPDATE TO rewind_edge_app USING (
        current_setting('rewind.media_cleanup_worker', TRUE) = 'true'
        OR rewind.owns_profile_media(user_id, supabase_user_id)
    ) WITH CHECK (
        current_setting('rewind.media_cleanup_worker', TRUE) = 'true'
        OR rewind.owns_profile_media(user_id, supabase_user_id)
    );
CREATE POLICY edge_app_profile_media_cleanup_delete ON rewind.profile_media_objects
    FOR DELETE TO rewind_edge_app USING (
        current_setting('rewind.media_cleanup_worker', TRUE) = 'true' AND status = 'DELETE'
    );

CREATE FUNCTION rewind.queue_replaced_profile_media() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, rewind AS $$
BEGIN
    UPDATE rewind.profile_media_objects SET status = 'DELETE', next_attempt_at = CURRENT_TIMESTAMP, locked_until = NULL, lock_token = NULL
    WHERE user_id = OLD.id AND status = 'ACTIVE' AND (
        (kind = 'avatar' AND public_url IS DISTINCT FROM NEW.avatar_url)
        OR (kind = 'banner' AND public_url IS DISTINCT FROM NEW.banner_url)
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER queue_replaced_profile_media AFTER UPDATE OF avatar_url, banner_url ON rewind.users
FOR EACH ROW EXECUTE FUNCTION rewind.queue_replaced_profile_media();

CREATE FUNCTION rewind.queue_deleted_profile_media() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, rewind AS $$
BEGIN
    UPDATE rewind.profile_media_objects SET status = 'DELETE', next_attempt_at = CURRENT_TIMESTAMP, locked_until = NULL, lock_token = NULL
    WHERE user_id = OLD.id;
    RETURN OLD;
END;
$$;
CREATE TRIGGER queue_deleted_profile_media BEFORE DELETE ON rewind.users
FOR EACH ROW EXECUTE FUNCTION rewind.queue_deleted_profile_media();

REVOKE ALL ON FUNCTION rewind.queue_replaced_profile_media() FROM PUBLIC;
REVOKE ALL ON FUNCTION rewind.queue_deleted_profile_media() FROM PUBLIC;
