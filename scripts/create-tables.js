const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const sql = `
CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name, category_id)
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS uoms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  symbol text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  sub_category_id uuid references sub_categories(id) on delete set null,
  brand_id uuid references brands(id) on delete set null,
  uom_id uuid references uoms(id) on delete restrict,
  barcode text unique,
  cost_price numeric(12,2) not null,
  selling_price numeric(12,2) not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- enforce uniqueness of sku only when it is not null
CREATE UNIQUE INDEX IF NOT EXISTS unique_nonnull_sku
ON inventory_items (sku)
WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  website text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references inventory_items(id) on delete cascade, -- which item
    
    supplier_id uuid references suppliers(id) on delete set null,           -- supplier (for purchases)
    receiver_id uuid references auth.users(id) on delete set null,          -- system user receiving
    supplier_receiver text,                                                 -- supplier’s delivery person
    
    transaction_type text not null check (transaction_type in ('purchase','sale')),
    
    qty_in numeric(12,2) default 0,       -- quantity coming in (purchase)
    in_cost numeric(12,2) default 0,      -- purchase cost
    
    qty_out numeric(12,2) default 0,      -- quantity going out (sale)
    out_cost numeric(12,2) default 0,     -- selling cost
    
    status text not null default 'pending' 
        check (status in ('pending','cancelled','deleted','completed')),    -- transaction state
    
    reference_no text,                    -- invoice/receipt number
    notes text,                           -- optional notes
    
    transaction_date timestamptz default now(),  -- business transaction date
    created_by uuid not null references auth.users(id) on delete restrict,  -- who logged it
    created_at timestamptz default now(),       -- system created time
    updated_at timestamptz default now()
);

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
