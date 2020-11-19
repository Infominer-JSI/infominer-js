-- create table for infominer datasets
CREATE TABLE IF NOT EXISTS im_datasets (
    id            serial    PRIMARY KEY,
    owner         varchar   NOT NULL,
    name          varchar   DEFAULT NULL,
    description   varchar   DEFAULT NULL,
    dbpath        varchar   DEFAULT NULL,
    creation_date timestamp with time zone DEFAULT NOW() NOT NULL,
    status        varchar   DEFAULT 'in_queue',
    parameters    jsonb
);

-- create indices
CREATE INDEX IF NOT EXISTS im_datasets_id_idx      ON im_datasets(id);
CREATE INDEX IF NOT EXISTS im_datasets_creator_idx ON im_datasets(owner);
CREATE INDEX IF NOT EXISTS im_datasets_status_idx  ON im_datasets(status);