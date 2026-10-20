ALTER TABLE reviews
    ADD COLUMN rating TINYINT NULL,
    ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN moderated_reason VARCHAR(255) NULL,
    ADD COLUMN moderated_at TIMESTAMP NULL,
    ADD COLUMN moderated_by BIGINT NULL,
    ADD CONSTRAINT fk_reviews_moderator
        FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE external_ratings
    MODIFY COLUMN source ENUM('IMDB', 'TMDB') NOT NULL;

ALTER TABLE movies
    MODIFY COLUMN rating DECIMAL(3,1) NULL;
