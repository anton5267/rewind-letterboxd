CREATE TABLE site_settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_by BIGINT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_site_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO site_settings (setting_key, setting_value) VALUES
    ('site_name', 'Rewind'),
    ('default_locale', 'uk'),
    ('maintenance_mode', 'false'),
    ('journal_enabled', 'true');
