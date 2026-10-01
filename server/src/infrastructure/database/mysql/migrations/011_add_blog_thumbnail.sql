-- migrate:up
ALTER TABLE blog_posts ADD COLUMN thumbnail_url VARCHAR(255) NULL;

-- migrate:down
ALTER TABLE blog_posts DROP COLUMN thumbnail_url;
