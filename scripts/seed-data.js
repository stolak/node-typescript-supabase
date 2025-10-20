const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

// Use your Supabase database connection string from the environment variable
const connectionString = process.env.SUPABASE_DB_URL;
const userId = process.env.SEED_USER_ID || 'd35495e7-3dd1-4dde-ab48-b98f6c25180e';
console.log("userId", userId);
console.log("connectionString", connectionString);
const seedData = {
  // Categories
  categories: [
    { name: 'Textbooks', description: 'Educational textbooks for various subjects' },
    { name: 'Stationery', description: 'Writing materials and office supplies' },
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Sports Equipment', description: 'Sports and physical education equipment' },
    { name: 'Laboratory Equipment', description: 'Science laboratory tools and equipment' },
    { name: 'Art Supplies', description: 'Art and craft materials' },
    { name: 'Furniture', description: 'School furniture and fixtures' },
    { name: 'Uniforms', description: 'School uniforms and clothing' }
  ],

  // Sub-categories
  subCategories: [
    // Textbooks sub-categories
    { name: 'Mathematics', category_name: 'Textbooks' },
    { name: 'English Language', category_name: 'Textbooks' },
    { name: 'Science', category_name: 'Textbooks' },
    { name: 'Social Studies', category_name: 'Textbooks' },
    { name: 'Literature', category_name: 'Textbooks' },
    
    // Stationery sub-categories
    { name: 'Pens & Pencils', category_name: 'Stationery' },
    { name: 'Notebooks', category_name: 'Stationery' },
    { name: 'Calculators', category_name: 'Stationery' },
    { name: 'Rulers & Geometry Sets', category_name: 'Stationery' },
    
    // Electronics sub-categories
    { name: 'Computers', category_name: 'Electronics' },
    { name: 'Tablets', category_name: 'Electronics' },
    { name: 'Projectors', category_name: 'Electronics' },
    { name: 'Audio Equipment', category_name: 'Electronics' }
  ],

  // Brands
  brands: [
    { name: 'Oxford' },
    { name: 'Cambridge' },
    { name: 'Pearson' },
    { name: 'Macmillan' },
    { name: 'Bic' },
    { name: 'Parker' },
    { name: 'Casio' },
    { name: 'HP' },
    { name: 'Dell' },
    { name: 'Samsung' },
    { name: 'Apple' },
    { name: 'Canon' },
    { name: 'Epson' },
    { name: 'Nike' },
    { name: 'Adidas' }
  ],

  // Units of Measure
  uoms: [
    { name: 'Piece', symbol: 'pcs' },
    { name: 'Box', symbol: 'box' },
    { name: 'Pack', symbol: 'pack' },
    { name: 'Set', symbol: 'set' },
    { name: 'Dozen', symbol: 'doz' },
    { name: 'Kilogram', symbol: 'kg' },
    { name: 'Gram', symbol: 'g' },
    { name: 'Liter', symbol: 'L' },
    { name: 'Meter', symbol: 'm' },
    { name: 'Centimeter', symbol: 'cm' }
  ],

  // Suppliers
  suppliers: [
    {
      name: 'Educational Supplies Ltd',
      contact_name: 'John Smith',
      email: 'john@educationalsupplies.com',
      phone: '+1-555-0101',
      address: '123 Education Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      website: 'https://educationalsupplies.com',
      notes: 'Primary supplier for textbooks and stationery'
    },
    {
      name: 'Tech Solutions Inc',
      contact_name: 'Sarah Johnson',
      email: 'sarah@techsolutions.com',
      phone: '+1-555-0102',
      address: '456 Technology Avenue',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      website: 'https://techsolutions.com',
      notes: 'Specializes in electronic equipment'
    },
    {
      name: 'Sports Equipment Co',
      contact_name: 'Mike Wilson',
      email: 'mike@sportsequipment.com',
      phone: '+1-555-0103',
      address: '789 Sports Boulevard',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      website: 'https://sportsequipment.com',
      notes: 'Sports and physical education equipment'
    },
    {
      name: 'Lab Supplies Pro',
      contact_name: 'Dr. Emily Brown',
      email: 'emily@labsupplies.com',
      phone: '+1-555-0104',
      address: '321 Science Drive',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      website: 'https://labsupplies.com',
      notes: 'Laboratory equipment and supplies'
    }
  ],

  // School Classes
  schoolClasses: [
    { name: 'Grade 1A', status: 'active' },
    { name: 'Grade 1B', status: 'active' },
    { name: 'Grade 2A', status: 'active' },
    { name: 'Grade 2B', status: 'active' },
    { name: 'Grade 3A', status: 'active' },
    { name: 'Grade 3B', status: 'active' },
    { name: 'Grade 4A', status: 'active' },
    { name: 'Grade 4B', status: 'active' },
    { name: 'Grade 5A', status: 'active' },
    { name: 'Grade 5B', status: 'active' },
    { name: 'Grade 6A', status: 'active' },
    { name: 'Grade 6B', status: 'active' },
    { name: 'Grade 7A', status: 'active' },
    { name: 'Grade 7B', status: 'active' },
    { name: 'Grade 8A', status: 'active' },
    { name: 'Grade 8B', status: 'active' },
    { name: 'Grade 9A', status: 'active' },
    { name: 'Grade 9B', status: 'active' },
    { name: 'Grade 10A', status: 'active' },
    { name: 'Grade 10B', status: 'active' },
    { name: 'Grade 11A', status: 'active' },
    { name: 'Grade 11B', status: 'active' },
    { name: 'Grade 12A', status: 'active' },
    { name: 'Grade 12B', status: 'active' }
  ],

  // Academic Session Terms
  academicSessionTerms: [
    {
      session: '2024/2025',
      name: 'First Term',
      start_date: '2024-09-01',
      end_date: '2024-12-20',
      status: 'active'
    },
    {
      session: '2024/2025',
      name: 'Second Term',
      start_date: '2025-01-06',
      end_date: '2025-04-04',
      status: 'active'
    },
    {
      session: '2024/2025',
      name: 'Third Term',
      start_date: '2025-04-21',
      end_date: '2025-07-18',
      status: 'active'
    },
    {
      session: '2025/2026',
      name: 'First Term',
      start_date: '2025-09-01',
      end_date: '2025-12-20',
      status: 'inactive'
    }
  ],

  // Sample Students
  students: [
    {
      admission_number: 'STU001',
      first_name: 'John',
      last_name: 'Doe',
      gender: 'male',
      date_of_birth: '2010-05-15',
      guardian_name: 'Jane Doe',
      guardian_contact: '+1-555-1001',
      address: '123 Main Street, City, State',
      status: 'active'
    },
    {
      admission_number: 'STU002',
      first_name: 'Sarah',
      last_name: 'Smith',
      gender: 'female',
      date_of_birth: '2010-08-22',
      guardian_name: 'Robert Smith',
      guardian_contact: '+1-555-1002',
      address: '456 Oak Avenue, City, State',
      status: 'active'
    },
    {
      admission_number: 'STU003',
      first_name: 'Michael',
      last_name: 'Johnson',
      gender: 'male',
      date_of_birth: '2009-12-10',
      guardian_name: 'Lisa Johnson',
      guardian_contact: '+1-555-1003',
      address: '789 Pine Road, City, State',
      status: 'active'
    },
    {
      admission_number: 'STU004',
      first_name: 'Emily',
      last_name: 'Brown',
      gender: 'female',
      date_of_birth: '2011-03-18',
      guardian_name: 'David Brown',
      guardian_contact: '+1-555-1004',
      address: '321 Elm Street, City, State',
      status: 'active'
    },
    {
      admission_number: 'STU005',
      first_name: 'James',
      last_name: 'Wilson',
      gender: 'male',
      date_of_birth: '2010-11-25',
      guardian_name: 'Mary Wilson',
      guardian_contact: '+1-555-1005',
      address: '654 Maple Drive, City, State',
      status: 'active'
    }
  ],

  // Class Teachers
  classTeachers: [
    {
      email: 'teacher1@school.com',
      name: 'Ms. Alice Johnson',
      role: 'class_teacher',
      status: 'active'
    },
    {
      email: 'teacher2@school.com',
      name: 'Mr. Bob Smith',
      role: 'class_teacher',
      status: 'active'
    },
    {
      email: 'teacher3@school.com',
      name: 'Ms. Carol Davis',
      role: 'class_teacher',
      status: 'active'
    },
    {
      email: 'teacher4@school.com',
      name: 'Mr. David Wilson',
      role: 'class_teacher',
      status: 'active'
    },
    {
      email: 'teacher5@school.com',
      name: 'Ms. Emma Brown',
      role: 'class_teacher',
      status: 'active'
    }
  ]
};

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  console.log("Using user ID:", userId);
  
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

    // 1. Seed Categories
    console.log("\n📚 Seeding categories...");
    for (const category of seedData.categories) {
      await client.query(`
        INSERT INTO categories (name, description, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [category.name, category.description]);
    }
    console.log(`✅ Inserted ${seedData.categories.length} categories`);

    // 2. Seed Sub-categories
    console.log("\n📖 Seeding sub-categories...");
    for (const subCategory of seedData.subCategories) {
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [subCategory.category_name]
      );
      
      if (categoryResult.rows.length > 0) {
        await client.query(`
          INSERT INTO sub_categories (name, category_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (name, category_id) DO NOTHING
        `, [subCategory.name, categoryResult.rows[0].id]);
      }
    }
    console.log(`✅ Inserted ${seedData.subCategories.length} sub-categories`);

    // 3. Seed Brands
    console.log("\n🏷️ Seeding brands...");
    for (const brand of seedData.brands) {
      await client.query(`
        INSERT INTO brands (name, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [brand.name]);
    }
    console.log(`✅ Inserted ${seedData.brands.length} brands`);

    // 4. Seed UOMs
    console.log("\n📏 Seeding units of measure...");
    for (const uom of seedData.uoms) {
      await client.query(`
        INSERT INTO uoms (name, symbol, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [uom.name, uom.symbol]);
    }
    console.log(`✅ Inserted ${seedData.uoms.length} units of measure`);

    // 5. Seed Suppliers
    console.log("\n🏢 Seeding suppliers...");
    for (const supplier of seedData.suppliers) {
      await client.query(`
        INSERT INTO suppliers (
          name, contact_name, email, phone, address, city, state, country, 
          website, notes, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [
        supplier.name, supplier.contact_name, supplier.email, supplier.phone,
        supplier.address, supplier.city, supplier.state, supplier.country,
        supplier.website, supplier.notes, userId
      ]);
    }
    console.log(`✅ Inserted ${seedData.suppliers.length} suppliers`);

    // 6. Seed School Classes
    console.log("\n🏫 Seeding school classes...");
    for (const schoolClass of seedData.schoolClasses) {
      await client.query(`
        INSERT INTO school_classes (name, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [schoolClass.name, schoolClass.status, userId]);
    }
    console.log(`✅ Inserted ${seedData.schoolClasses.length} school classes`);

    // 7. Seed Academic Session Terms
    console.log("\n📅 Seeding academic session terms...");
    for (const term of seedData.academicSessionTerms) {
      await client.query(`
        INSERT INTO academic_session_terms (session, name, start_date, end_date, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (session, name) DO NOTHING
      `, [term.session, term.name, term.start_date, term.end_date, term.status]);
    }
    console.log(`✅ Inserted ${seedData.academicSessionTerms.length} academic session terms`);

    // 8. Seed Students
    console.log("\n👨‍🎓 Seeding students...");
    const classResult = await client.query('SELECT id FROM school_classes ORDER BY name LIMIT 1');
    const defaultClassId = classResult.rows[0]?.id;

    for (const student of seedData.students) {
      await client.query(`
        INSERT INTO students (
          admission_number, first_name, last_name, gender, date_of_birth,
          class_id, guardian_name, guardian_contact, address, status, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (admission_number) DO NOTHING
      `, [
        student.admission_number, student.first_name, student.last_name,
        student.gender, student.date_of_birth, defaultClassId,
        student.guardian_name, student.guardian_contact, student.address,
        student.status, userId
      ]);
    }
    console.log(`✅ Inserted ${seedData.students.length} students`);

    // 9. Seed Class Teachers
    console.log("\n👩‍🏫 Seeding class teachers...");
    const classes = await client.query('SELECT id FROM school_classes ORDER BY name');

    // Only insert one class teacher since teacher_id must be unique
    if (classes.rows.length > 0) {
      const teacher = seedData.classTeachers[0];
      const classId = classes.rows[0].id;

      await client.query(`
        INSERT INTO class_teachers (
          teacher_id, email, name, class_id, role, status, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (teacher_id) DO NOTHING
      `, [userId, teacher.email, teacher.name, classId, teacher.role, teacher.status, userId]);
    }
    console.log(`✅ Inserted 1 class teacher`);

    // 10. Seed Sample Inventory Items
    console.log("\n📦 Seeding sample inventory items...");
    const mathCategory = await client.query("SELECT id FROM categories WHERE name = 'Textbooks'");
    const mathSubCategory = await client.query("SELECT id FROM sub_categories WHERE name = 'Mathematics'");
    const oxfordBrand = await client.query("SELECT id FROM brands WHERE name = 'Oxford'");
    const pieceUom = await client.query("SELECT id FROM uoms WHERE name = 'Piece'");

    const sampleItems = [
      {
        sku: 'MATH-G1-001',
        name: 'Mathematics Grade 1 Textbook',
        cost_price: 25.00,
        selling_price: 30.00,
        low_stock_threshold: 10
      },
      {
        sku: 'ENG-G1-001',
        name: 'English Language Grade 1 Textbook',
        cost_price: 22.00,
        selling_price: 27.00,
        low_stock_threshold: 10
      },
      {
        sku: 'SCI-G1-001',
        name: 'Science Grade 1 Textbook',
        cost_price: 28.00,
        selling_price: 33.00,
        low_stock_threshold: 8
      },
      {
        sku: 'PEN-BLUE-001',
        name: 'Blue Ballpoint Pen',
        cost_price: 0.50,
        selling_price: 1.00,
        low_stock_threshold: 100
      },
      {
        sku: 'CALC-BASIC-001',
        name: 'Basic Calculator',
        cost_price: 15.00,
        selling_price: 20.00,
        low_stock_threshold: 20
      }
    ];

    for (const item of sampleItems) {
      await client.query(`
        INSERT INTO inventory_items (
          sku, name, category_id, sub_category_id, brand_id, uom_id,
          cost_price, selling_price, low_stock_threshold, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        item.sku, item.name,
        mathCategory.rows[0]?.id,
        mathSubCategory.rows[0]?.id,
        oxfordBrand.rows[0]?.id,
        pieceUom.rows[0]?.id,
        item.cost_price, item.selling_price, item.low_stock_threshold, userId
      ]);
    }
    console.log(`✅ Inserted ${sampleItems.length} sample inventory items`);

    // 11. Seed Sample Inventory Transactions
    console.log("\n💰 Seeding sample inventory transactions...");
    const items = await client.query('SELECT id FROM inventory_items LIMIT 3');
    const supplier = await client.query('SELECT id FROM suppliers LIMIT 1');

    const sampleTransactions = [
      {
        item_id: items.rows[0]?.id,
        supplier_id: supplier.rows[0]?.id,
        transaction_type: 'purchase',
        qty_in: 100,
        in_cost: 2500.00,
        status: 'completed',
        reference_no: 'PO-2024-001',
        notes: 'Initial stock purchase'
      },
      {
        item_id: items.rows[1]?.id,
        supplier_id: supplier.rows[0]?.id,
        transaction_type: 'purchase',
        qty_in: 80,
        in_cost: 1760.00,
        status: 'completed',
        reference_no: 'PO-2024-002',
        notes: 'Textbook restock'
      },
      {
        item_id: items.rows[2]?.id,
        supplier_id: supplier.rows[0]?.id,
        transaction_type: 'purchase',
        qty_in: 60,
        in_cost: 1680.00,
        status: 'completed',
        reference_no: 'PO-2024-003',
        notes: 'Science textbook order'
      }
    ];

    for (const transaction of sampleTransactions) {
      if (transaction.item_id) {
        await client.query(`
          INSERT INTO inventory_transactions (
            item_id, supplier_id, transaction_type, qty_in, in_cost, status,
            reference_no, notes, transaction_date, created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW())
        `, [
          transaction.item_id, transaction.supplier_id, transaction.transaction_type,
          transaction.qty_in, transaction.in_cost, transaction.status,
          transaction.reference_no, transaction.notes, userId
        ]);
      }
    }
    console.log(`✅ Inserted ${sampleTransactions.length} sample inventory transactions`);

    // 12. Seed Sample Class Inventory Entitlements
    console.log("\n🎓 Seeding sample class inventory entitlements...");
    const firstClass = await client.query('SELECT id FROM school_classes ORDER BY name LIMIT 1');
    const firstTerm = await client.query(
      "SELECT id FROM academic_session_terms WHERE status = 'active' ORDER BY created_at DESC LIMIT 1"
    );

    if (firstClass.rows[0] && firstTerm.rows[0] && items.rows[0]) {
      await client.query(`
        INSERT INTO class_inventory_entitlements (
          class_id, inventory_item_id, session_term_id, quantity, notes, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (class_id, inventory_item_id, session_term_id) DO NOTHING
      `, [
        firstClass.rows[0].id, items.rows[0].id, firstTerm.rows[0].id,
        30, 'Mathematics textbooks for Grade 1A', userId
      ]);
    }
    console.log("✅ Inserted sample class inventory entitlements");

    // Commit transaction
    await client.query('COMMIT');
    console.log("\n🎉 Database seeding completed successfully!");

    // Display summary
    console.log("\n📊 Seeding Summary:");
    console.log(`- Categories: ${seedData.categories.length}`);
    console.log(`- Sub-categories: ${seedData.subCategories.length}`);
    console.log(`- Brands: ${seedData.brands.length}`);
    console.log(`- Units of Measure: ${seedData.uoms.length}`);
    console.log(`- Suppliers: ${seedData.suppliers.length}`);
    console.log(`- School Classes: ${seedData.schoolClasses.length}`);
    console.log(`- Academic Session Terms: ${seedData.academicSessionTerms.length}`);
    console.log(`- Students: ${seedData.students.length}`);
    console.log(`- Class Teachers: ${Math.min(seedData.classTeachers.length, classes.rows.length)}`);
    console.log(`- Sample Inventory Items: ${sampleItems.length}`);
    console.log(`- Sample Transactions: ${sampleTransactions.length}`);
    console.log(`- Sample Entitlements: 1`);

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
