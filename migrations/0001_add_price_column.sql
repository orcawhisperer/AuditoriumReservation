-- Add price column to shows table
ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "price" integer DEFAULT 0;