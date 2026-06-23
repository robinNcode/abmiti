-- Abmiti MySQL Schema
-- Run this once when DB_PROVIDER=mysql

CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(36)   NOT NULL PRIMARY KEY,
  name       VARCHAR(80)   NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  password   VARCHAR(255)  NOT NULL,
  budget     DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  icon       VARCHAR(20)  NOT NULL DEFAULT '📦',
  color      VARCHAR(20)  NOT NULL DEFAULT '#c2552a',
  type       ENUM('income','expense','savings','investment','payable','receivable') NOT NULL,
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_category (user_id, name, type),
  INDEX idx_cat_user_type (user_id, type),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id             VARCHAR(36)   NOT NULL PRIMARY KEY,
  user_id        VARCHAR(36)   NOT NULL,
  name           VARCHAR(100)  NOT NULL,
  type           ENUM('bank','mobile') NOT NULL,
  account_number VARCHAR(50)   DEFAULT NULL,
  bank_name      VARCHAR(100)  DEFAULT NULL,
  provider       ENUM('bkash','nagad','rocket') DEFAULT NULL,
  balance        DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_accounts_user_type     (user_id, type),
  INDEX idx_accounts_user_active   (user_id, is_active),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entries (
  id              VARCHAR(36)   NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36)   NOT NULL,
  type            ENUM('income','expense','savings','investment','payable','receivable') NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  note            VARCHAR(300)  NOT NULL DEFAULT '',
  category_id     VARCHAR(36)   NOT NULL,
  source          ENUM('bank','bkash','nagad','cash','card','other') NOT NULL DEFAULT 'cash',
  account_id      VARCHAR(36)   DEFAULT NULL,
  sector          VARCHAR(120)  NOT NULL DEFAULT '',
  date            DATE          NOT NULL,
  parsed_from_sms TINYINT(1)   NOT NULL DEFAULT 0,
  raw_sms         TEXT          DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entries_user_date      (user_id, date DESC),
  INDEX idx_entries_user_type_date (user_id, type, date DESC),
  INDEX idx_entries_user_category  (user_id, category_id),
  CONSTRAINT fk_entries_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_entries_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_entries_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)   ON DELETE SET NULL
);

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

CREATE TABLE IF NOT EXISTS budget_lines (
  id                VARCHAR(36) PRIMARY KEY,
  budget_id         VARCHAR(36) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  icon              VARCHAR(20) DEFAULT '📦',
  color             VARCHAR(7) DEFAULT '#4A7C59',
  allocation_method ENUM('percentage','fixed') NOT NULL,
  allocation_value  DECIMAL(10,4) NOT NULL,
  sort_order        SMALLINT DEFAULT 0,
  is_active         TINYINT(1) DEFAULT 1,
  note              TEXT,
  INDEX idx_budget_lines_budget (budget_id),
  CONSTRAINT fk_budget_lines_budget FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budget_line_categories (
  budget_line_id VARCHAR(36) NOT NULL,
  category_id    VARCHAR(36) NOT NULL,
  PRIMARY KEY (budget_line_id, category_id),
  CONSTRAINT fk_budget_line_categories_line FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_line_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budget_sub_items (
  id              VARCHAR(36) PRIMARY KEY,
  budget_line_id  VARCHAR(36) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  expected_amount DECIMAL(15,2) NOT NULL,
  note            TEXT,
  CONSTRAINT fk_budget_sub_items_line FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE
);
