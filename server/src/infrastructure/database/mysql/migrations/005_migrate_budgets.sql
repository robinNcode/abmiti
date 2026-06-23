-- migrate:up
CREATE TABLE IF NOT EXISTS budgets (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  month         TINYINT UNSIGNED NOT NULL,
  year          SMALLINT UNSIGNED NOT NULL,
  total_income  DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_template   TINYINT(1) NOT NULL DEFAULT 0,
  template_name VARCHAR(100) DEFAULT NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month_year_template (user_id, month, year, is_template),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP PROCEDURE IF EXISTS migrate_budgets_to_budget_feature;
DELIMITER $$
CREATE PROCEDURE migrate_budgets_to_budget_feature()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'total_income'
  ) THEN
    ALTER TABLE budgets CHANGE amount total_income DECIMAL(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'total_income'
  ) THEN
    ALTER TABLE budgets ADD COLUMN total_income DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER year;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'is_template'
  ) THEN
    ALTER TABLE budgets ADD COLUMN is_template TINYINT(1) NOT NULL DEFAULT 0 AFTER total_income;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'template_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN template_name VARCHAR(100) DEFAULT NULL AFTER is_template;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE budgets ADD COLUMN notes TEXT AFTER template_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND index_name = 'uq_user_month_year'
  ) THEN
    ALTER TABLE budgets DROP INDEX uq_user_month_year;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND index_name = 'uq_user_month_year_template'
  ) THEN
    ALTER TABLE budgets ADD UNIQUE KEY uq_user_month_year_template (user_id, month, year, is_template);
  END IF;
END$$
DELIMITER ;
CALL migrate_budgets_to_budget_feature();
DROP PROCEDURE IF EXISTS migrate_budgets_to_budget_feature;

-- migrate:down
DROP TABLE IF EXISTS budgets;
