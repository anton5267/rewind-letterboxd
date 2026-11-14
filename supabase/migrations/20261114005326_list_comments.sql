ALTER TABLE rewind.lists
    ADD COLUMN reply_preference VARCHAR(8)
    CONSTRAINT lists_reply_preference_check CHECK (reply_preference IN ('ANYONE', 'FOLLOWED', 'SELF'));

ALTER TABLE rewind.comments
    ALTER COLUMN review_id DROP NOT NULL,
    ADD COLUMN list_id BIGINT REFERENCES rewind.lists(id) ON DELETE CASCADE,
    ADD CONSTRAINT comments_one_parent_check CHECK (num_nonnulls(review_id, list_id) = 1);

CREATE INDEX idx_comments_list_created ON rewind.comments(list_id, created_at, id);

GRANT SELECT (reply_preference), INSERT (reply_preference), UPDATE (reply_preference)
    ON rewind.lists TO rewind_edge_app;
GRANT SELECT (list_id), INSERT (list_id) ON rewind.comments TO rewind_edge_app;

CREATE FUNCTION rewind.comment_target_is_visible(target_review BIGINT, target_list BIGINT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY INVOKER
SET search_path = pg_catalog, rewind
AS $$
    SELECT CASE
        WHEN target_review IS NOT NULL AND target_list IS NULL THEN EXISTS (
            SELECT 1 FROM rewind.reviews r
            JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published
            JOIN rewind.users owner ON owner.id = r.user_id AND owner.is_active
            WHERE r.id = target_review AND NOT r.is_hidden
        )
        WHEN target_list IS NOT NULL AND target_review IS NULL THEN EXISTS (
            SELECT 1 FROM rewind.lists l
            JOIN rewind.users owner ON owner.id = l.user_id AND owner.is_active
            WHERE l.id = target_list AND l.list_type = 'CUSTOM' AND l.is_public
        )
        ELSE FALSE
    END;
$$;

CREATE FUNCTION rewind.comment_reply_is_allowed(target_review BIGINT, target_list BIGINT, actor_id BIGINT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY INVOKER
SET search_path = pg_catalog, rewind
AS $$
    SELECT rewind.comment_target_is_visible(target_review, target_list)
        AND EXISTS (SELECT 1 FROM rewind.users actor WHERE actor.id = actor_id AND actor.is_active)
        AND EXISTS (
            SELECT 1 FROM (
                SELECT r.user_id AS owner_id, COALESCE(r.reply_preference, owner.reply_preference) AS preference
                FROM rewind.reviews r JOIN rewind.users owner ON owner.id = r.user_id
                WHERE r.id = target_review AND target_list IS NULL
                UNION ALL
                SELECT l.user_id AS owner_id, COALESCE(l.reply_preference, owner.reply_preference) AS preference
                FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
                WHERE l.id = target_list AND target_review IS NULL
            ) target
            WHERE target.owner_id = actor_id OR (
                NOT EXISTS (
                    SELECT 1 FROM rewind.user_blocks block
                    WHERE (block.blocker_id = target.owner_id AND block.blocked_id = actor_id)
                        OR (block.blocker_id = actor_id AND block.blocked_id = target.owner_id)
                ) AND (
                    target.preference = 'ANYONE' OR (
                        target.preference = 'FOLLOWED' AND EXISTS (
                            SELECT 1 FROM rewind.follows follow
                            WHERE follow.follower_id = target.owner_id AND follow.following_id = actor_id
                        )
                    )
                )
            )
        );
$$;

REVOKE ALL ON FUNCTION rewind.comment_target_is_visible(BIGINT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION rewind.comment_reply_is_allowed(BIGINT, BIGINT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rewind.comment_target_is_visible(BIGINT, BIGINT) TO rewind_edge_app;
GRANT EXECUTE ON FUNCTION rewind.comment_reply_is_allowed(BIGINT, BIGINT, BIGINT) TO rewind_edge_app;

ALTER POLICY edge_app_comment_insert ON rewind.comments
    WITH CHECK (
        user_id = (SELECT rewind.current_rewind_user_id())
        AND rewind.comment_reply_is_allowed(review_id, list_id, user_id)
    );

ALTER POLICY edge_app_comments_select_combined ON rewind.comments
    USING (
        rewind.current_user_is_admin()
        OR user_id = (SELECT rewind.current_rewind_user_id())
        OR (
            NOT is_hidden
            AND EXISTS (SELECT 1 FROM rewind.users author WHERE author.id = rewind.comments.user_id AND author.is_active)
            AND rewind.comment_target_is_visible(review_id, list_id)
        )
    );

ALTER POLICY edge_app_comment_report_insert ON rewind.comment_reports
    WITH CHECK (
        reporter_id = (SELECT rewind.current_rewind_user_id())
        AND EXISTS (
            SELECT 1 FROM rewind.comments c
            JOIN rewind.users author ON author.id = c.user_id AND author.is_active
            WHERE c.id = rewind.comment_reports.comment_id
                AND c.user_id <> (SELECT rewind.current_rewind_user_id())
                AND NOT c.is_hidden
                AND rewind.comment_target_is_visible(c.review_id, c.list_id)
        )
    );
