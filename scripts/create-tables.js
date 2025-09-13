const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const sql = `
create table categories (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);


create table sub_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category_id uuid references categories(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(name, category_id) -- ensures no duplicate subcategory under the same category
);


create table brands (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create table uoms (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,       -- e.g., "Kilogram", "Piece", "Box"
    symbol text unique not null,     -- e.g., "kg", "pcs", "box"
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create table inventory_items (
    id uuid primary key default gen_random_uuid(),
    sku text,                                           -- Item ID / SKU (nullable)
    name text not null,                                 -- Item Name / Description
    category_id uuid references categories(id) on delete set null,
    sub_category_id uuid references sub_categories(id) on delete set null,
    brand_id uuid references brands(id) on delete set null,
    uom_id uuid references uoms(id) on delete restrict, -- Unit of Measure (FK)
    barcode text unique,                                -- Barcode / QR Code
    cost_price numeric(12,2) not null,                  -- Cost Price
    selling_price numeric(12,2) not null,               -- Selling Price
    created_by uuid references auth.users(id) on delete set null, -- User who created item
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- enforce uniqueness of sku only when it is not null
create unique index unique_nonnull_sku
on inventory_items (sku)
where sku is not null;

`;

async function run() {
  if (!connectionString) {
    console.error("SUPABASE_DB_URL environment variable is not set.");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Tables created if not exist.");
  } catch (err) {
    console.error("Error running SQL:", err);
  } finally {
    await client.end();
  }
}

run();
