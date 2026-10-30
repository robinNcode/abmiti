-- migrate:up
-- Fix emoji storage on production cPanel MySQL where the database/tables
-- were created with latin1 charset. This converts all text columns to
-- utf8mb4 so that emoji like 📦 🏠 ⭐ are stored and returned correctly.
--
-- IMPORTANT: Run this via phpMyAdmin or cPanel's MySQL Databases tool if the
-- migration runner does not have ALTER DATABASE privilege.

-- 1. Convert the individual tables (always safe even without DB-level privs)
ALTER TABLE users        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE categories   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE budget_lines CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE entries      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE budgets      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE blog_posts   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE notifications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE contact_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Try to set the database default charset (may fail on shared hosting — that is OK)
-- If this line errors, comment it out and re-run.
-- ALTER DATABASE DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- migrate:down
-- No safe rollback (converting back to latin1 would lose emoji).

