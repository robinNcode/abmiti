-- migrate:up
CREATE TABLE IF NOT EXISTS budget_sub_items (
  id              VARCHAR(36) PRIMARY KEY,
  budget_line_id  VARCHAR(36) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  expected_amount DECIMAL(15,2) NOT NULL,
  note            TEXT,
  CONSTRAINT fk_budget_sub_items_line FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS budget_sub_items;
