-- update table by adding new columns
ALTER TABLE infominer.datasets ADD COLUMN IF NOT EXISTS file jsonb;
ALTER TABLE infominer.datasets ADD COLUMN IF NOT EXISTS n_documents integer;
