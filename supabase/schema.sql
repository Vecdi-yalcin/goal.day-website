-- Supabase SQL Schema for GolDay Website
-- Run this in Supabase SQL Editor to set up the database for production deployment

-- Create table to store the full football dataset
CREATE TABLE IF NOT EXISTS golday_data (
  id BIGINT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Enable RLS for security
ALTER TABLE golday_data ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (data is already filtered by API)
CREATE POLICY "Allow public read access" ON golday_data
  FOR SELECT USING (true);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_golday_data_id ON golday_data (id);

-- Table is now ready for data insertion
-- Next step: Insert the dataset from secrets/data.json
