-- migrate:up
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
  parsed_from_sms TINYINT(1)    NOT NULL DEFAULT 0,
  raw_sms         TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entries_user_date (user_id, date DESC),
  INDEX idx_entries_user_type_date (user_id, type, date DESC),
  INDEX idx_entries_user_category (user_id, category_id),
  CONSTRAINT fk_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_entries_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_entries_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- migrate:down
DROP TABLE IF EXISTS entries;
