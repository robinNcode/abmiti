-- migrate:up
ALTER TABLE users
  ADD COLUMN avatar VARCHAR(500) DEFAULT NULL AFTER budget,
  ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER avatar,
  ADD UNIQUE KEY uq_users_google_id (google_id),
  MODIFY COLUMN password VARCHAR(255) NULL;

-- migrate:down
ALTER TABLE users
  DROP INDEX uq_users_google_id,
  DROP COLUMN google_id,
  DROP COLUMN avatar,
  MODIFY COLUMN password VARCHAR(255) NOT NULL;
