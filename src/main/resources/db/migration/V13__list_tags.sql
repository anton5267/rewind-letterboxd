CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tags_slug UNIQUE (slug)
);

CREATE TABLE list_tags (
    list_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (list_id, tag_id),
    CONSTRAINT fk_list_tags_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_list_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE RESTRICT,
    INDEX idx_list_tags_tag (tag_id, list_id)
);
