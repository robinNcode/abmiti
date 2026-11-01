-- migrate:up

CREATE TABLE IF NOT EXISTS receivables (
  id              VARCHAR(36)    NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36)    NOT NULL,
  counterparty    VARCHAR(100)   NOT NULL,
  principal       DECIMAL(15,2)  NOT NULL CHECK (principal > 0),
  received_amount DECIMAL(15,2)  NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
  kind            ENUM('lent_cash','unpaid_income') NOT NULL,
  category_id     VARCHAR(36)    DEFAULT NULL,
  account_id      VARCHAR(36)    DEFAULT NULL,
  due_date        DATE           DEFAULT NULL,
  note            VARCHAR(300)   DEFAULT NULL,
  status          ENUM('open','settled','cancelled') NOT NULL DEFAULT 'open',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_receivables_received_lte_principal CHECK (received_amount <= principal),
  INDEX idx_receivables_user_status_due (user_id, status, due_date),
  CONSTRAINT fk_receivables_user     FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_receivables_category FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL,
  CONSTRAINT fk_receivables_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS receivable_id VARCHAR(36) DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_entries_receivable (receivable_id),
  ADD CONSTRAINT fk_entries_receivable FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE RESTRICT;

-- migrate:down
ALTER TABLE entries DROP FOREIGN KEY fk_entries_receivable;
ALTER TABLE entries DROP INDEX idx_entries_receivable;
ALTER TABLE entries DROP COLUMN receivable_id;
DROP TABLE IF EXISTS receivables;
