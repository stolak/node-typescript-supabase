const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

console.log("connectionString", connectionString);
const seedData = {
  // Roles
  roles: [
    { code: 'ADMIN', name: 'Administrator', status: 'active' },
    { code: 'SUPER_ADMIN', name: 'Super Administrator', status: 'active' },
    { code: 'CLASS_TEACHER', name: 'Class Teacher', status: 'active' },
    { code: 'STORE_ATTENDANCE', name: 'Store Attendance', status: 'active' },
    { code: 'SCHOOL_ADMIN', name: 'School Administrator', status: 'active' }
  ],

  // Categories
 
  // Class Teachers

};

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
 
  
  if (!connectionString) {
    console.error("❌ SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Start transaction
    await client.query('BEGIN');

    // 1. Seed Roles
    console.log("\n👤 Seeding roles...");
    for (const role of seedData.roles) {
      await client.query(`
        INSERT INTO roles (code, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
      `, [role.code, role.name, role.status]);
    }
    console.log(`✅ Inserted ${seedData.roles.length} roles`);

   

    

    // Commit transaction
    await client.query('COMMIT');
    console.log("\n🎉 Database seeding completed successfully!");

    // Display summary
    

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

seedDatabase();
