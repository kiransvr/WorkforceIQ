-- WorkforceIQ Postgres initialization
-- Runs once on first container start

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for field-level encryption helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable Row Level Security globally (enforced per-table in migrations)
-- Individual tables enable RLS and define policies in TypeORM migrations
