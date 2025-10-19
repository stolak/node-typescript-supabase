const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const createTeachersSQL = `
-- Script to create class_teachers records for existing received_by values
-- This should be run BEFORE the migration if you want to preserve the received_by data

DO $$ 
DECLARE
  rec RECORD;
  new_teacher_id UUID;
BEGIN
  -- Find all unique received_by values that don't have corresponding class_teachers records
  FOR rec IN 
    SELECT DISTINCT 
      cid.received_by,
      cid.receiver_name,
      cid.class_id,
      cid.session_term_id
    FROM class_inventory_distributions cid
    WHERE cid.received_by IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 
      FROM class_teachers ct 
      WHERE ct.teacher_id = cid.received_by
    )
  LOOP
    -- Generate a new UUID for the class_teachers record
    new_teacher_id := gen_random_uuid();
    
    -- Insert into class_teachers table
    INSERT INTO class_teachers (
      id,
      teacher_id,
      email,
      name,
      class_id,
      session_term_id,
      role,
      status,
      created_by
    ) VALUES (
      new_teacher_id,
      rec.received_by,
      COALESCE(rec.received_by::text, 'unknown@example.com'), -- Use received_by as email if no better option
      COALESCE(rec.receiver_name, 'Unknown Teacher'),
      rec.class_id,
      rec.session_term_id,
      'class_teacher',
      'active',
      rec.received_by -- Use the same user as created_by
    );
    
    RAISE NOTICE 'Created class_teacher record: ID=%, teacher_id=%, name=%', 
      new_teacher_id, rec.received_by, rec.receiver_name;
    
    -- Update the class_inventory_distributions to use the new class_teachers.id
    UPDATE class_inventory_distributions 
    SET received_by = new_teacher_id
    WHERE received_by = rec.received_by;
    
    RAISE NOTICE 'Updated distributions to use new class_teacher ID: %', new_teacher_id;
  END LOOP;
  
  RAISE NOTICE 'Completed creating missing class_teachers records';
END $$;

-- Verify the results
SELECT 
  COUNT(*) as total_distributions,
  COUNT(CASE WHEN received_by IS NOT NULL THEN 1 END) as with_received_by,
  COUNT(CASE WHEN received_by IS NULL THEN 1 END) as without_received_by
FROM class_inventory_distributions;

SELECT 
  COUNT(*) as total_class_teachers
FROM class_teachers;
`;

async function createMissingTeachers() {
  console.log("Creating missing class_teachers records for existing received_by values...");
  
  if (!connectionString) {
    console.error("SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to database");
    
    // Check current state
    console.log("\n=== Current State ===");
    const currentState = await client.query(`
      SELECT 
        COUNT(*) as total_distributions,
        COUNT(CASE WHEN received_by IS NOT NULL THEN 1 END) as with_received_by,
        COUNT(CASE WHEN received_by IS NULL THEN 1 END) as without_received_by
      FROM class_inventory_distributions
    `);
    console.log("Class inventory distributions:", currentState.rows[0]);
    
    const teachersCount = await client.query(`
      SELECT COUNT(*) as total_class_teachers
      FROM class_teachers
    `);
    console.log("Class teachers:", teachersCount.rows[0]);
    
    const problematicRecords = await client.query(`
      SELECT 
        received_by,
        receiver_name,
        COUNT(*) as count
      FROM class_inventory_distributions cid
      WHERE cid.received_by IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 
        FROM class_teachers ct 
        WHERE ct.teacher_id = cid.received_by
      )
      GROUP BY received_by, receiver_name
    `);
    console.log("Problematic received_by values:", problematicRecords.rows);
    
    if (problematicRecords.rows.length === 0) {
      console.log("No problematic records found. All received_by values already have corresponding class_teachers records.");
      return;
    }
    
    console.log("\n=== Creating Missing Teachers ===");
    await client.query(createTeachersSQL);
    console.log("Missing teachers created successfully!");
    
    // Verify the results
    console.log("\n=== Final State ===");
    const finalState = await client.query(`
      SELECT 
        COUNT(*) as total_distributions,
        COUNT(CASE WHEN received_by IS NOT NULL THEN 1 END) as with_received_by,
        COUNT(CASE WHEN received_by IS NULL THEN 1 END) as without_received_by
      FROM class_inventory_distributions
    `);
    console.log("Class inventory distributions:", finalState.rows[0]);
    
    const finalTeachersCount = await client.query(`
      SELECT COUNT(*) as total_class_teachers
      FROM class_teachers
    `);
    console.log("Class teachers:", finalTeachersCount.rows[0]);
    
  } catch (err) {
    console.error("Error creating missing teachers:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

createMissingTeachers();
