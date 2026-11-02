-- migrate:up

SET @has_quick_expenses = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'quick_expenses');
SET @stmt = IF(@has_quick_expenses = 0, 'ALTER TABLE users ADD COLUMN quick_expenses JSON DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- migrate:down
ALTER TABLE users DROP COLUMN quick_expenses;
