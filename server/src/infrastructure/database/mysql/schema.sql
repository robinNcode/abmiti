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
