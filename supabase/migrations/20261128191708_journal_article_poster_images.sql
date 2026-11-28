ALTER TABLE rewind.journal_articles
    ADD COLUMN poster_images JSONB,
    ADD CONSTRAINT journal_poster_images_array CHECK (
        poster_images IS NULL OR (
            jsonb_typeof(poster_images) = 'array'
            AND jsonb_array_length(poster_images) BETWEEN 1 AND 3
        )
    );

GRANT SELECT (poster_images), INSERT (poster_images), UPDATE (poster_images)
    ON rewind.journal_articles TO rewind_edge_app;
