CREATE TABLE list_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    list_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_list_likes_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_list_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_list_likes_pair UNIQUE (list_id, user_id),
    INDEX idx_list_likes_list_created (list_id, created_at),
    INDEX idx_list_likes_user_created (user_id, created_at)
);
