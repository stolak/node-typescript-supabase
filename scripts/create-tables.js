const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;

const sql = `
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text, -- optional description
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ensure description column exists in categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='categories' AND column_name='description'
  ) THEN
    ALTER TABLE categories ADD COLUMN description text;
  END IF;
END $$;

-- Sub-categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text, -- optional description
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name, category_id)
);

-- ensure description column exists in sub_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='sub_categories' AND column_name='description'
  ) THEN
    ALTER TABLE sub_categories ADD COLUMN description text;
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS school_classes (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,                               -- e.g., "Class 1A"
    class_teacher_id uuid references auth.users(id) on delete set null, -- optional FK to user      
    status text not null default 'active' 
        check (status in ('active','inactive','archived')), -- class state
    created_by uuid not null references auth.users(id) on delete restrict, -- who created it
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS students (
    id uuid primary key default gen_random_uuid(),
    admission_number text unique not null,           -- unique student ID/admission number
    first_name text not null,
    middle_name text,                                -- optional
    last_name text not null,
    gender text not null check (gender in ('male','female','other')),
    date_of_birth date not null,
    class_id uuid references school_classes(id) on delete set null, -- current class
    guardian_name text,                              -- parent/guardian full name
    guardian_contact text,                           -- phone/email of guardian
    address text,                                    -- student home address
    status text not null default 'active' 
        check (status in ('active','inactive','graduated','transferred','suspended','archived')),
    created_by uuid not null references auth.users(id) on delete restrict, -- user who registered student
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS academic_session_terms (
    id uuid primary key default gen_random_uuid(),
    session text not null,                 -- e.g., "2025/2026"
    name text not null,                    -- e.g., "First Term"
    start_date date not null,
    end_date date not null,
    status text not null default 'active'
        check (status in ('active','inactive','archived')),
    created_at timestamptz default now(),
    unique (session, name)                 -- prevent duplicate term names per session
);
CREATE TABLE IF NOT EXISTS class_inventory_entitlements (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references school_classes(id) on delete cascade,
    inventory_item_id uuid not null references inventory_items(id) on delete cascade,
    session_term_id uuid not null references academic_session_terms(id) on delete cascade,
    quantity int not null check (quantity >= 0),  -- how many items the class is eligible to get
    notes text,                                  -- optional remarks (e.g., "core textbook only")
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (class_id, inventory_item_id, session_term_id) -- prevent duplicates
);

CREATE TABLE IF NOT EXISTS class_inventory_distributions (
    id uuid primary key default gen_random_uuid(),

    class_id uuid not null references school_classes(id) on delete cascade,
    inventory_item_id uuid not null references inventory_items(id) on delete cascade,
    session_term_id uuid not null references academic_session_terms(id) on delete cascade,

    distributed_quantity int not null check (distributed_quantity > 0),
    distribution_date timestamptz not null default now(),

    received_by uuid references auth.users(id) on delete set null, -- teacher/staff who acknowledged
    receiver_name text,                                           -- fallback if no user record
    notes text,                                                   -- optional remarks (e.g., "partial delivery")

    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
CREATE TABLE IF NOT EXISTS student_inventory_log (
    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id) on delete cascade,
    class_id uuid not null references school_classes(id) on delete cascade,
    session_term_id uuid not null references academic_session_terms(id) on delete cascade,
    inventory_item_id uuid not null references inventory_items(id) on delete cascade,

    qty int not null check (qty > 0),          -- number of items given to the student
    eligible boolean not null default true,    -- whether student was entitled
    received boolean not null default false,   -- whether collected
    received_date timestamptz,                 -- when collected

    given_by uuid references auth.users(id) on delete set null,  -- teacher/class rep
    created_by uuid not null references auth.users(id) on delete restrict, -- admin entry

    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    unique (student_id, session_term_id, inventory_item_id) 
    -- prevents duplicate entries for same student/item/term
);

CREATE TABLE IF NOT EXISTS class_teachers (
    id uuid primary key default gen_random_uuid(),

    class_id uuid references school_classes(id) on delete set null,
        -- nullable: teacher may not be assigned to a class right now

    session_term_id uuid references academic_session_terms(id) on delete set null,
        -- nullable: assignment may not be tied to a session/term

    teacher_id uuid not null references auth.users(id) on delete restrict, 
        -- the assigned teacher (must exist, cannot delete if assigned)

    email text not null unique,
        -- each teacher must have a unique email
    name text not null,
        -- full name of the teacher

    role text not null default 'class_teacher'
        check (role in ('class_teacher', 'assistant_teacher', 'subject_teacher')), 

    status text not null default 'active'
        check (status in ('active','inactive','archived')),

    assigned_at timestamptz default now(),
    unassigned_at timestamptz, -- nullable, when teacher left the class

    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz default now(),
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
