-- migrate:up
CREATE TABLE IF NOT EXISTS budget_line_categories (
  budget_line_id VARCHAR(36) NOT NULL,
  category_id    VARCHAR(36) NOT NULL,
  PRIMARY KEY (budget_line_id, category_id),
  CONSTRAINT fk_budget_line_categories_line FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_line_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS budget_line_categories;
