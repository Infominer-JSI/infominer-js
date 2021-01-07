-- use correct database
CREATE SCHEMA IF NOT EXISTS infominer;

-- create dataset status enumerated type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        LEFT JOIN pg_namespace p ON t.typnamespace=p.oid
        WHERE t.typname='status' AND p.nspname='infominer'
    ) THEN
        CREATE TYPE infominer.status AS ENUM ('IN_QUEUE', 'LOADING', 'FINISHED');
    END IF;
END
$$;

-- create table for infominer datasets
CREATE TABLE IF NOT EXISTS infominer.datasets (
    id            serial  PRIMARY KEY,
    owner         varchar NOT NULL,
    name          varchar DEFAULT NULL,
    description   varchar DEFAULT NULL,
    dbpath        varchar DEFAULT NULL,
    creation_date timestamp with time zone DEFAULT NOW() NOT NULL,
    status        infominer.status DEFAULT 'IN_QUEUE',
    parameters    jsonb
);

-- create indices
CREATE INDEX IF NOT EXISTS im_datasets_id_idx      ON infominer.datasets(id);
CREATE INDEX IF NOT EXISTS im_datasets_creator_idx ON infominer.datasets(owner);
CREATE INDEX IF NOT EXISTS im_datasets_status_idx  ON infominer.datasets(status);