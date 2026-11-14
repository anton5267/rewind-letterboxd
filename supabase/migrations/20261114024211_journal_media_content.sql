ALTER TABLE rewind.journal_articles
    ADD COLUMN cover_images JSONB,
    ADD COLUMN content_blocks JSONB,
    ADD CONSTRAINT journal_cover_images_array CHECK (
        cover_images IS NULL OR (jsonb_typeof(cover_images) = 'array' AND jsonb_array_length(cover_images) BETWEEN 1 AND 3)
    ),
    ADD CONSTRAINT journal_content_blocks_array CHECK (
        content_blocks IS NULL OR (jsonb_typeof(content_blocks) = 'array' AND jsonb_array_length(content_blocks) BETWEEN 1 AND 64)
    );
GRANT SELECT (cover_images, content_blocks), INSERT (cover_images, content_blocks), UPDATE (cover_images, content_blocks)
    ON rewind.journal_articles TO rewind_edge_app;
