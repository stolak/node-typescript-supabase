const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const migrationSQL = `
-- Migration script to update inventory_transactions table
-- This script is safe to run multiple times

DO $$ 
BEGIN
  -- Add distribution_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'inventory_transactions' 
                 AND column_name = 'distribution_id') THEN
    ALTER TABLE inventory_transactions 
    ADD COLUMN distribution_id uuid references class_inventory_distributions(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added distribution_id column to inventory_transactions table';
  ELSE
    RAISE NOTICE 'distribution_id column already exists in inventory_transactions table';
  END IF;

  -- Update transaction_type constraint to include new values
  -- First check if the constraint exists and drop it
  IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
             WHERE constraint_name = 'inventory_transactions_transaction_type_check') THEN
    ALTER TABLE inventory_transactions 
    DROP CONSTRAINT inventory_transactions_transaction_type_check;
    
    RAISE NOTICE 'Dropped existing transaction_type constraint';
  END IF;

  

END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_transactions' 
  AND column_name = 'distribution_id';

-- Show the updated constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'inventory_transactions_transaction_type_check';
`;

async function runMigration() {
  console.log("Starting inventory_transactions table migration...");
  console.log("Connection string:", connectionString ? "Found" : "Missing");
  
  if (!connectionString) {
    console.error("SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to database");
    
    await client.query(migrationSQL);
    console.log("Migration completed successfully!");
    
  } catch (err) {
    console.error("Error running migration:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

runMigration();
