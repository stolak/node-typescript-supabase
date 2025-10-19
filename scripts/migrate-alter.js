const { Client } = require("pg");
require("dotenv").config({ path: ".env copy 2" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const migrationSQL = `
-- Migration script to update class_inventory_distributions.received_by column
-- This script handles the change from auth.users to class_teachers

DO $$ 
DECLARE
  rec RECORD;
BEGIN
  -- Step 1: Check if there are any existing records with received_by values
  -- that don't have corresponding class_teachers records
  IF EXISTS (
    SELECT 1 
    FROM class_inventory_distributions cid
    WHERE cid.received_by IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 
      FROM class_teachers ct 
      WHERE ct.teacher_id = cid.received_by
    )
  ) THEN
    RAISE NOTICE 'Found records with received_by values that do not exist in class_teachers table';
    RAISE NOTICE 'These records will need to be handled before proceeding with the migration';
    
    -- Show the problematic records
    RAISE NOTICE 'Problematic records:';
    FOR rec IN 
      SELECT id, received_by, receiver_name 
      FROM class_inventory_distributions 
      WHERE received_by IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM class_teachers WHERE teacher_id = received_by
      )
    LOOP
      RAISE NOTICE 'Distribution ID: %, received_by: %, receiver_name: %', 
        rec.id, rec.received_by, rec.receiver_name;
    END LOOP;
    
    -- For now, we'll set these to NULL to allow the migration to proceed
    -- You may want to create corresponding class_teachers records first
    UPDATE class_inventory_distributions 
    SET received_by = NULL 
    WHERE received_by IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM class_teachers WHERE teacher_id = received_by
    );
    
    RAISE NOTICE 'Set problematic received_by values to NULL';
  END IF;

  -- Step 2: Drop the existing foreign key constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'class_inventory_distributions_received_by_fkey'
  ) THEN
    ALTER TABLE class_inventory_distributions 
    DROP CONSTRAINT class_inventory_distributions_received_by_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint on received_by';
  END IF;

  -- Step 3: Add the new foreign key constraint to class_teachers
  ALTER TABLE class_inventory_distributions 
  ADD CONSTRAINT class_inventory_distributions_received_by_fkey 
  FOREIGN KEY (received_by) REFERENCES class_teachers(id) ON DELETE RESTRICT;
  
  RAISE NOTICE 'Added new foreign key constraint to class_teachers table';

  -- Step 4: Make the column NOT NULL (only if all values are now valid)
  IF NOT EXISTS (
    SELECT 1 
    FROM class_inventory_distributions 
    WHERE received_by IS NULL
  ) THEN
    ALTER TABLE class_inventory_distributions 
    ALTER COLUMN received_by SET NOT NULL;
    RAISE NOTICE 'Set received_by column to NOT NULL';
  ELSE
    RAISE NOTICE 'Cannot set received_by to NOT NULL - there are still NULL values';
    RAISE NOTICE 'You may need to update these records or handle them differently';
  END IF;

END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'class_inventory_distributions' 
  AND column_name = 'received_by';

-- Show the foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'class_inventory_distributions'
  AND kcu.column_name = 'received_by';
`;

async function runMigration() {
  console.log("Starting class_inventory_distributions.received_by column migration...");
  console.log("This will change the foreign key from auth.users to class_teachers");
  
  if (!connectionString) {
    console.error("SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to database");
    
    // First, let's check the current state
    console.log("\n=== Current State Check ===");
    const currentState = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'class_inventory_distributions' 
        AND column_name = 'received_by'
    `);
    console.log("Current received_by column:", currentState.rows[0]);
    
    // Check for problematic records
    const problematicRecords = await client.query(`
      SELECT COUNT(*) as count
      FROM class_inventory_distributions cid
      WHERE cid.received_by IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 
        FROM class_teachers ct 
        WHERE ct.teacher_id = cid.received_by
      )
    `);
    console.log("Records with invalid received_by values:", problematicRecords.rows[0].count);
    
    if (problematicRecords.rows[0].count > 0) {
      console.log("\n⚠️  WARNING: Found records with received_by values that don't exist in class_teachers table");
      console.log("These will be set to NULL during migration. You may want to create corresponding class_teachers records first.");
      
      const showProblematic = await client.query(`
        SELECT id, received_by, receiver_name 
        FROM class_inventory_distributions 
        WHERE received_by IS NOT NULL 
        AND NOT EXISTS (
          SELECT 1 FROM class_teachers WHERE teacher_id = received_by
        )
        LIMIT 5
      `);
      console.log("Sample problematic records:", showProblematic.rows);
    }
    
    console.log("\n=== Running Migration ===");
    await client.query(migrationSQL);
    console.log("Migration completed successfully!");
    
    // Verify the changes
    console.log("\n=== Verification ===");
    const newState = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'class_inventory_distributions' 
        AND column_name = 'received_by'
    `);
    console.log("New received_by column:", newState.rows[0]);
    
    const constraints = await client.query(`
      SELECT 
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'class_inventory_distributions'
        AND kcu.column_name = 'received_by'
    `);
    console.log("Foreign key constraints:", constraints.rows);
    
  } catch (err) {
    console.error("Error running migration:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

runMigration();