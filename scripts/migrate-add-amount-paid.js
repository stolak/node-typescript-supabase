const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

// Specify the table name here
const TABLE_NAME = "inventory_transactions"; // Change this to the table you want to alter

const migrationSQL = `
-- Migration script to add amount_paid column
-- This script adds the amount_paid column if it doesn't exist

DO $$ 
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = '${TABLE_NAME}' 
    AND column_name = 'amount_paid'
  ) THEN
    -- Add the column
    ALTER TABLE ${TABLE_NAME} 
    ADD COLUMN amount_paid numeric(12,2) DEFAULT 0;
    
    RAISE NOTICE 'Added amount_paid column to ${TABLE_NAME} table';
  ELSE
    RAISE NOTICE 'Column amount_paid already exists in ${TABLE_NAME} table';
    
    -- Update the column if it exists but doesn't have the right default
    ALTER TABLE ${TABLE_NAME} 
    ALTER COLUMN amount_paid SET DEFAULT 0;
    
    -- Ensure the data type is correct
    ALTER TABLE ${TABLE_NAME} 
    ALTER COLUMN amount_paid TYPE numeric(12,2);
    
    RAISE NOTICE 'Updated amount_paid column in ${TABLE_NAME} table';
  END IF;
END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = '${TABLE_NAME}' 
  AND column_name = 'amount_paid';
`;

async function runMigration() {
  console.log(`Starting migration to add amount_paid column to ${TABLE_NAME}...`);
  
  if (!connectionString) {
    console.error("❌ SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("✅ Connected to database");
    
    // Check current state
    console.log("\n=== Current State Check ===");
    const currentState = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
        AND column_name = 'amount_paid'
    `, [TABLE_NAME]);
    
    if (currentState.rows.length > 0) {
      console.log("Current amount_paid column:", currentState.rows[0]);
    } else {
      console.log("Column amount_paid does not exist yet");
    }
    
    // Run migration
    console.log("\n=== Running Migration ===");
    await client.query(migrationSQL);
    console.log("✅ Migration completed successfully!");
    
    // Verify the changes
    console.log("\n=== Verification ===");
    const newState = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
        AND column_name = 'amount_paid'
    `, [TABLE_NAME]);
    
    if (newState.rows.length > 0) {
      console.log("✅ New amount_paid column:", newState.rows[0]);
    } else {
      console.log("❌ Column was not created");
    }
    
  } catch (err) {
    console.error("❌ Error running migration:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\nDatabase connection closed");
  }
}

runMigration();

