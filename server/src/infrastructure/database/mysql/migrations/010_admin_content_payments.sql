SET @has_user_type = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='user_type');
SET @role_migration = IF(@has_user_type=0, 'ALTER TABLE users ADD COLUMN user_type ENUM(''admin'',''user'') NOT NULL DEFAULT ''user''', 'SELECT 1');
PREPARE role_statement FROM @role_migration;
EXECUTE role_statement;
DEALLOCATE PREPARE role_statement;
CREATE TABLE IF NOT EXISTS contact_messages (id VARCHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(255) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS blog_posts (id VARCHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, excerpt TEXT, content LONGTEXT NOT NULL, published BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS site_config (config_key VARCHAR(80) PRIMARY KEY, config_value JSON NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (id VARCHAR(36) PRIMARY KEY, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, target_user_id VARCHAR(36) NULL, read_by JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_notification_target (target_user_id));
CREATE TABLE IF NOT EXISTS payments (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, transaction_id VARCHAR(80) NOT NULL UNIQUE, amount DECIMAL(12,2) NOT NULL, plan VARCHAR(30) NOT NULL, status VARCHAR(20) NOT NULL, gateway_data JSON NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    transaction_id VARCHAR(80) NOT NULL UNIQUE,
    plan VARCHAR(30) NOT NULL,
    starts_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_subscriptions_user_id (user_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_expires_at (expires_at)
);