const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const sql = `
-- ===============================================
-- REFACTORED SCHEMA WITH CONSISTENT ON DELETE RULES
-- ===============================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sub-categories
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references categories(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name, category_id)
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Units of Measure
CREATE TABLE IF NOT EXISTS uoms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  symbol text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  category_id uuid references categories(id) ON DELETE RESTRICT,
  sub_category_id uuid references sub_categories(id) ON DELETE RESTRICT,
  brand_id uuid references brands(id) ON DELETE RESTRICT,
  uom_id uuid references uoms(id) ON DELETE RESTRICT,
  barcode text,
  cost_price numeric(12,2) not null,
  selling_price numeric(12,2) not null,
  low_stock_threshold INTEGER DEFAULT 0 CHECK (low_stock_threshold >= 0),
  created_by uuid references auth.users(id) ON DELETE SET NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Uniqueness for non-nullable SKU and barcode
CREATE UNIQUE INDEX IF NOT EXISTS unique_nonnull_sku
ON inventory_items (sku)
WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_nonnull_barcode
ON inventory_items (barcode)
WHERE barcode IS NOT NULL;

-- Suppliers
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
  created_by uuid references auth.users(id) ON DELETE SET NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) ON DELETE RESTRICT,
  supplier_id uuid references suppliers(id) ON DELETE SET NULL,
  receiver_id uuid references auth.users(id) ON DELETE SET NULL,
  supplier_receiver text,
  transaction_type text not null check (transaction_type in ('purchase','sale')),
  qty_in numeric(12,2) default 0,
  in_cost numeric(12,2) default 0,
  qty_out numeric(12,2) default 0,
  out_cost numeric(12,2) default 0,
  status text not null default 'pending' check (status in ('pending','cancelled','deleted','completed')),
  reference_no text,
  notes text,
  transaction_date timestamptz default now(),
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- School Classes
CREATE TABLE IF NOT EXISTS school_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  class_teacher_id uuid references auth.users(id) ON DELETE SET NULL,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid primary key default gen_random_uuid(),
  admission_number text unique not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text not null check (gender in ('male','female','other')),
  date_of_birth date not null,
  class_id uuid references school_classes(id) ON DELETE SET NULL,
  guardian_name text,
  guardian_contact text,
  address text,
  status text not null default 'active' check (status in ('active','inactive','graduated','transferred','suspended','archived')),
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Academic Sessions/Terms
CREATE TABLE IF NOT EXISTS academic_session_terms (
  id uuid primary key default gen_random_uuid(),
  session text not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz default now(),
  unique (session, name)
);

-- Class Inventory Entitlements
CREATE TABLE IF NOT EXISTS class_inventory_entitlements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references school_classes(id) ON DELETE SET NULL,
  inventory_item_id uuid not null references inventory_items(id) ON DELETE RESTRICT,
  session_term_id uuid not null references academic_session_terms(id) ON DELETE RESTRICT,
  quantity int not null check (quantity >= 0),
  notes text,
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (class_id, inventory_item_id, session_term_id)
);

-- Class Inventory Distributions
CREATE TABLE IF NOT EXISTS class_inventory_distributions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references school_classes(id) ON DELETE SET NULL,
  inventory_item_id uuid not null references inventory_items(id) ON DELETE RESTRICT,
  session_term_id uuid not null references academic_session_terms(id) ON DELETE RESTRICT,
  distributed_quantity int not null check (distributed_quantity > 0),
  distribution_date timestamptz not null default now(),
  received_by uuid references auth.users(id) ON DELETE SET NULL,
  receiver_name text,
  notes text,
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Student Inventory Log
CREATE TABLE IF NOT EXISTS student_inventory_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) ON DELETE RESTRICT,
  class_id uuid not null references school_classes(id) ON DELETE SET NULL,
  session_term_id uuid not null references academic_session_terms(id) ON DELETE RESTRICT,
  inventory_item_id uuid not null references inventory_items(id) ON DELETE RESTRICT,
  qty int not null check (qty > 0),
  eligible boolean not null default true,
  received boolean not null default false,
  received_date timestamptz,
  given_by uuid references auth.users(id) ON DELETE SET NULL,
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Class Teachers
CREATE TABLE IF NOT EXISTS class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references school_classes(id) ON DELETE SET NULL,
  session_term_id uuid references academic_session_terms(id) ON DELETE RESTRICT,
  teacher_id uuid not null references auth.users(id) ON DELETE RESTRICT,
  email text not null unique,
  name text not null,
  role text not null default 'class_teacher' check (role in ('class_teacher', 'assistant_teacher', 'subject_teacher')),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  assigned_at timestamptz default now(),
  unassigned_at timestamptz,
  created_by uuid not null references auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory Summary View
DROP VIEW IF EXISTS inventory_item_summary;
CREATE OR REPLACE VIEW inventory_item_summary AS
SELECT 
  i.*,
  c.name AS category_name,
  sc.name AS sub_category_name,
  b.name AS brand_name,
  u.name AS uom_name,
  COALESCE(SUM(t.qty_in) - SUM(t.qty_out), 0) AS current_stock,
  COALESCE(SUM(t.in_cost), 0) AS total_in_cost,
  COALESCE(SUM(t.out_cost), 0) AS total_out_cost
FROM inventory_items i
LEFT JOIN categories c ON c.id = i.category_id
LEFT JOIN sub_categories sc ON sc.id = i.sub_category_id
LEFT JOIN brands b ON b.id = i.brand_id
LEFT JOIN uoms u ON u.id = i.uom_id
LEFT JOIN inventory_transactions t ON t.item_id = i.id AND t.status = 'completed'
GROUP BY i.id, c.name, sc.name, b.name, u.name;

`;

async function run() {
  console.log(connectionString);
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
