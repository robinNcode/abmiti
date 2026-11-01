-- migrate:up
ALTER TABLE budget_line_categories
  ADD COLUMN budget_id VARCHAR(36) NULL AFTER budget_line_id;

UPDATE budget_line_categories blc
JOIN budget_lines bl ON bl.id = blc.budget_line_id
SET blc.budget_id = bl.budget_id;

ALTER TABLE budget_line_categories
  MODIFY COLUMN budget_id VARCHAR(36) NOT NULL,
  ADD CONSTRAINT fk_budget_line_categories_budget FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
  ADD CONSTRAINT uq_budget_line_categories_budget_category UNIQUE (budget_id, category_id);

-- migrate:down
ALTER TABLE budget_line_categories
  DROP FOREIGN KEY fk_budget_line_categories_budget,
  DROP INDEX uq_budget_line_categories_budget_category,
  DROP COLUMN budget_id;
