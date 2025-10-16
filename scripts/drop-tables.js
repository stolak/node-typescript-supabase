const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

const connectionString = process.env.SUPABASE_DB_URL;

const dropSQL = `
DROP VIEW IF EXISTS inventory_item_summary;

DROP TABLE IF EXISTS
  class_teachers,
  student_inventory_log,
  class_inventory_distributions,
  class_inventory_entitlements,
  students,
  school_classes,
  academic_session_terms,
  inventory_transactions,
  suppliers,
  inventory_items,
  uoms,
  brands,
  sub_categories,
  categories
CASCADE;
`;

async function dropAll() {
  if (!connectionString) {
    console.error("SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query(dropSQL);
    console.log("✅ All tables and view dropped successfully.");
  } catch (err) {
    console.error("❌ Error dropping tables:", err);
  } finally {
    await client.end();
  }
}

dropAll();
