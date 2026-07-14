-- backend/schema.sql
-- PostgreSQL schema for ReviewLens application

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    business_id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    stars REAL,
    review_count INTEGER,
    categories TEXT[],
    hours JSONB  -- new column to store opening hours per day, e.g., {"Monday":"9:00-17:00",...}
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    review_count INTEGER,
    average_stars REAL,
    fans INTEGER
);


CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_business_location ON businesses(latitude, longitude);
