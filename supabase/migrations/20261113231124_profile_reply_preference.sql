ALTER TABLE rewind.users
    ADD COLUMN reply_preference VARCHAR(8) NOT NULL DEFAULT 'ANYONE'
    CONSTRAINT users_reply_preference_check CHECK (reply_preference IN ('ANYONE', 'FOLLOWED', 'SELF'));

GRANT SELECT (reply_preference), UPDATE (reply_preference) ON rewind.users TO rewind_edge_app;

-- Replace the original permissive INSERT policy so its owner-only predicate
-- cannot independently allow replies denied by the author's preference.
ALTER POLICY edge_app_comment_insert ON rewind.comments
    TO rewind_edge_app
    WITH CHECK (
        user_id = (SELECT rewind.current_rewind_user_id())
        AND EXISTS (
            SELECT 1 FROM rewind.users actor
            WHERE actor.id = rewind.comments.user_id AND actor.is_active
        )
        AND EXISTS (
            SELECT 1
            FROM rewind.reviews review
            JOIN rewind.users author ON author.id = review.user_id AND author.is_active
            JOIN rewind.movies movie ON movie.id = review.movie_id AND movie.is_published
            WHERE review.id = rewind.comments.review_id
                AND NOT review.is_hidden
                AND (
                    review.user_id = rewind.comments.user_id
                    OR (
                        NOT EXISTS (
                            SELECT 1 FROM rewind.user_blocks block
                            WHERE (block.blocker_id = review.user_id AND block.blocked_id = rewind.comments.user_id)
                                OR (block.blocker_id = rewind.comments.user_id AND block.blocked_id = review.user_id)
                        )
                        AND (
                            author.reply_preference = 'ANYONE'
                            OR (
                                author.reply_preference = 'FOLLOWED'
                                AND EXISTS (
                                    SELECT 1 FROM rewind.follows follow
                                    WHERE follow.follower_id = review.user_id
                                        AND follow.following_id = rewind.comments.user_id
                                )
                            )
                        )
                    )
                )
        )
    );
