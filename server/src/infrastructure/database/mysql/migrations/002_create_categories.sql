-- migrate:up
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

-- migrate:down
DROP TABLE IF EXISTS categories;
