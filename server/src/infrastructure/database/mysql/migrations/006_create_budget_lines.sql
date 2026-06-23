-- migrate:up
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

-- migrate:down
DROP TABLE IF EXISTS budget_lines;
