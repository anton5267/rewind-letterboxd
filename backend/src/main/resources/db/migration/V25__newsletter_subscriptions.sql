CREATE TABLE newsletter_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    subscribed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_newsletter_subscriptions_user UNIQUE (user_id),
    CONSTRAINT fk_newsletter_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_newsletter_subscriptions_active (is_subscribed, user_id)
);
