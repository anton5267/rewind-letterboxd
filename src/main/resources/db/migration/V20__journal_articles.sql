CREATE TABLE journal_articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(180) NOT NULL,
    language VARCHAR(2) NOT NULL,
    category VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt VARCHAR(500) NULL,
    content TEXT NOT NULL,
    cover_url VARCHAR(500) NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    author_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_journal_articles_slug_language UNIQUE (slug, language),
    CONSTRAINT fk_journal_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_journal_articles_public (language, is_published, published_at)
);
