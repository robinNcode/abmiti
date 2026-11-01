-- migrate:up

CREATE TABLE IF NOT EXISTS payables (
  id              VARCHAR(36)    NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36)    NOT NULL,
  counterparty    VARCHAR(100)   NOT NULL,
  principal       DECIMAL(15,2)  NOT NULL CHECK (principal > 0),
  paid_amount     DECIMAL(15,2)  NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  kind            ENUM('borrowed_cash','unpaid_expense') NOT NULL,
  category_id     VARCHAR(36)    DEFAULT NULL,
  account_id      VARCHAR(36)    DEFAULT NULL,
  due_date        DATE           DEFAULT NULL,
  note            VARCHAR(300)   DEFAULT NULL,
  status          ENUM('open','settled','cancelled') NOT NULL DEFAULT 'open',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_payables_paid_lte_principal CHECK (paid_amount <= principal),
  INDEX idx_payables_user_status_due (user_id, status, due_date),
  CONSTRAINT fk_payables_user     FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_payables_category FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL,
  CONSTRAINT fk_payables_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS payable_id VARCHAR(36) DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_entries_payable (payable_id),
  ADD CONSTRAINT fk_entries_payable FOREIGN KEY (payable_id) REFERENCES payables(id) ON DELETE RESTRICT;

-- migrate:down
ALTER TABLE entries DROP FOREIGN KEY fk_entries_payable;
ALTER TABLE entries DROP INDEX idx_entries_payable;
ALTER TABLE entries DROP COLUMN payable_id;
DROP TABLE IF EXISTS payables;
