-- migrate:up
-- Fix emoji storage on production cPanel MySQL where the database/tables
-- were created with latin1 charset. This converts all text columns to
-- utf8mb4 so that emoji like 📦 🏠 ⭐ are stored and returned correctly.
--
-- IMPORTANT: Run this via phpMyAdmin or cPanel's MySQL Databases tool if the
-- migration runner does not have ALTER DATABASE privilege.

-- 1. Only convert tables that are still on a legacy non-utf8mb4 collation.
-- On a modern MySQL instance that is already utf8mb4, this migration becomes a no-op
-- instead of trying to rebuild tables with foreign keys attached.
SELECT COUNT(*) INTO @needs_charset_fix
FROM information_schema.tables
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','categories','budget_lines','entries','budgets','blog_posts','notifications','contact_messages')
  AND TABLE_COLLATION IN ('latin1_swedish_ci','latin1_general_ci','latin1_general_cs','utf8mb3_general_ci','utf8mb4_general_ci','utf8mb4_bin')
  OR TABLE_COLLATION IS NULL;

SET @stmt = IF(@needs_charset_fix > 0, 'SET FOREIGN_KEY_CHECKS = 0', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE budget_lines CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE entries CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE budgets CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE blog_posts CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE notifications CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'ALTER TABLE contact_messages CONVERT TO CHARACTER SET utf8mb4', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(@needs_charset_fix > 0, 'SET FOREIGN_KEY_CHECKS = 1', 'SELECT 1');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Try to set the database default charset (may fail on shared hosting — that is OK)
-- If this line errors, comment it out and re-run.
-- ALTER DATABASE DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- migrate:down
-- No safe rollback (converting back to latin1 would lose emoji).

