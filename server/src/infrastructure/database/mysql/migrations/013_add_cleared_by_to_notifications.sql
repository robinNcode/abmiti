-- migrate:up
SET @has_cleared_by = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='notifications' AND column_name='cleared_by');
SET @alter_stmt = IF(@has_cleared_by=0, 'ALTER TABLE notifications ADD COLUMN cleared_by JSON DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @alter_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- migrate:down
ALTER TABLE notifications DROP COLUMN IF EXISTS cleared_by;
