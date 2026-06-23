-- migrate:up
CREATE TABLE IF NOT EXISTS accounts (
  id             VARCHAR(36)   NOT NULL PRIMARY KEY,
  user_id        VARCHAR(36)   NOT NULL,
  name           VARCHAR(100)  NOT NULL,
  type           ENUM('bank','mobile') NOT NULL,
  account_number VARCHAR(50)   DEFAULT NULL,
  bank_name      VARCHAR(100)  DEFAULT NULL,
  provider       ENUM('bkash','nagad','rocket') DEFAULT NULL,
  balance        DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_accounts_user_type (user_id, type),
  INDEX idx_accounts_user_active (user_id, is_active),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS accounts;
