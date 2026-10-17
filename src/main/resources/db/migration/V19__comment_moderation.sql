ALTER TABLE comments
    ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN moderated_reason VARCHAR(255) NULL,
    ADD COLUMN moderated_at TIMESTAMP NULL,
    ADD COLUMN moderated_by BIGINT NULL,
    ADD CONSTRAINT fk_comments_moderated_by FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_comments_hidden_created ON comments (is_hidden, created_at);
