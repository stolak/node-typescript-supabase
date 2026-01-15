const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;
const userId = process.env.SEED_USER_ID || '94537861-44cb-49d4-b2b1-58ea89e27ae9';

// Default IDs for inventory items
const DEFAULT_BRAND_ID = 'dcea601a-5d74-4fe6-a2cd-e3d9844ba0d3';
const DEFAULT_CATEGORY_ID = 'caabb0fb-e423-46c8-9436-3dde056ee211';
const DEFAULT_SUPPLIER_ID = '70d00913-44b5-468b-9a07-434f16b8bfca';
const DEFAULT_UOM_ID = '450a5970-deec-4c60-98a6-50c410f87d81';

console.log("🌱 Starting inventory items seeding...");
console.log("Using user ID:", userId);

if (!connectionString) {
  console.error("❌ SUPABASE_DB_URL environment variable is not set.");
  process.exit(1);
}

const client = new Client({ connectionString });

async function seedInventoryItems() {
  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Start transaction
    await client.query('BEGIN');

    // Load inventory items data
    console.log("\n📦 Loading inventory items data...");
    const inventoryItemsData = require('./inventory-items-data.js');
    const inventoryItems = inventoryItemsData.inventoryItems || [];
    console.log(`📋 Found ${inventoryItems.length} items to seed`);

    // Seed Inventory Items
    console.log("\n📦 Seeding inventory items...");
    const insertedItemIds = [];
    
    for (const item of inventoryItems) {
      // Check if item with this SKU already exists
      const existing = await client.query(
        'SELECT id FROM inventory_items WHERE sku = $1',
        [item.sku]
      );
      
      let itemId;
      if (existing.rows.length > 0) {
        // Item exists, use existing ID
        itemId = existing.rows[0].id;
        // Update the name in case it changed
        await client.query(
          'UPDATE inventory_items SET name = $1, updated_at = NOW() WHERE id = $2',
          [item.name, itemId]
        );
      } else {
        // Insert new item
        const result = await client.query(`
          INSERT INTO inventory_items (
            sku, name, category_id, brand_id, uom_id,
            cost_price, selling_price, low_stock_threshold, created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id
        `, [
          item.sku,
          item.name,
          DEFAULT_CATEGORY_ID,
          DEFAULT_BRAND_ID,
          DEFAULT_UOM_ID,
          0, // cost_price
          0, // selling_price
          0, // low_stock_threshold
          userId
        ]);
        itemId = result.rows[0].id;
      }
      
      insertedItemIds.push({
        id: itemId,
        qty: item.qty
      });
    }
    console.log(`✅ Inserted ${inventoryItems.length} inventory items`);

    // Seed Inventory Transactions (for items with qty > 0)
    console.log("\n💰 Seeding inventory transactions...");
    let transactionCount = 0;
    
    for (const itemData of insertedItemIds) {
      if (itemData.qty > 0) {
        await client.query(`
          INSERT INTO inventory_transactions (
            item_id, supplier_id, transaction_type, qty_in, in_cost, qty_out, out_cost, amount_paid, status,
            transaction_date, created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW())
        `, [
          itemData.id,
          DEFAULT_SUPPLIER_ID,
          'purchase',
          itemData.qty, // qty_in
          0, // in_cost
          0, // qty_out
          0, // out_cost
          0, // amount_paid
          'completed',
          userId
        ]);
        transactionCount++;
      }
    }
    console.log(`✅ Inserted ${transactionCount} inventory transactions`);

    // Commit transaction
    await client.query('COMMIT');
    console.log("\n🎉 Inventory items seeding completed successfully!");

    // Display summary
    console.log("\n📊 Seeding Summary:");
    console.log(`- Inventory Items: ${inventoryItems.length}`);
    console.log(`- Inventory Transactions: ${transactionCount}`);
    console.log(`- Items with quantity > 0: ${transactionCount}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error seeding inventory items:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\nDatabase connection closed");
  }
}

seedInventoryItems();

