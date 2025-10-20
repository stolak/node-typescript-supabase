import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { InventoryService } from "../services/inventoryService";

const router = Router();
const inventoryService = new InventoryService();
/**
 * @openapi
 * /api/v1/inventory_transactions:
 *   get:
 *     summary: Get all inventory transactions
 *     tags:
 *       - InventoryTransactions
 *     parameters:
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [purchase, sale, distribution, return]
 *         required: false
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: List of inventory transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryTransaction'
 *   post:
 *     summary: Create a new inventory transaction (purchase or sale or distribution or return)
 *     tags:
 *       - InventoryTransactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryTransactionInput'
 *     responses:
 *       201:
 *         description: Inventory transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransaction'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(
      `*, inventory_items(id, name, categories(id, name)), suppliers(id, name)`
    );

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.item_id || !body.transaction_type) {
    return res.status(400).json({
      error: "item_id and transaction_type are required",
    });
  }

  if (!["purchase", "sale"].includes(body.transaction_type)) {
    return res
      .status(400)
      .json({ error: "transaction_type must be 'purchase' or 'sale'" });
  }

  if (
    body.transaction_type === "sale" &&
    (!body.qty_out || body.qty_out <= 0)
  ) {
    return res.status(400).json({ error: "qty_out is required for sales" });
  }

  if (body.transaction_type === "sale") {
    // check current stock level if enough for the sale

    const inventorySummary = await inventoryService.getInventorySummary(
      body.item_id
    );
    if ((inventorySummary?.current_stock || 0) < (Number(body.qty_out) || 0)) {
      return res.status(400).json({ error: "Insufficient stock for the sale" });
    }
  }

  if (
    body.transaction_type === "purchase" &&
    (!body.qty_in || body.qty_in <= 0)
  ) {
    return res.status(400).json({ error: "qty_in is required for purchases" });
  }

  if ((body.qty_in ?? 0) > 0 && (body.qty_out ?? 0) > 0) {
    return res.status(400).json({
      error:
        "Both qty_in and qty_out cannot be greater than 0 in a single transaction",
    });
  }

  const { data, error } = await supabase
    .from("inventory_transactions")
    .insert([
      {
        ...body,
        receiver_id: req.user?.id || body.receiver_id || "",
        created_by: req.user?.id || body.created_by || "",
      },
    ])
    .select(
      `*, inventory_items(id, name, categories(id, name)), suppliers(id, name)`
    )
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/inventory_transactions/{id}:
 *   get:
 *     summary: Get an inventory transaction by ID
 *     tags:
 *       - InventoryTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory transaction found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransaction'
 *       404:
 *         description: Inventory transaction not found
 *   put:
 *     summary: Update an inventory transaction by ID
 *     tags:
 *       - InventoryTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryTransactionInput'
 *     responses:
 *       200:
 *         description: Inventory transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransaction'
 *       404:
 *         description: Inventory transaction not found
 *   delete:
 *     summary: Delete an inventory transaction by ID
 *     tags:
 *       - InventoryTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Inventory transaction deleted
 *       404:
 *         description: Inventory transaction not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(
      `*, inventory_items(id, name, categories(id, name)), suppliers(id, name)`
    )
    .eq("id", id)
    .single();

  if (error)
    return res.status(404).json({ error: "Inventory transaction not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  const { data, error } = await supabase
    .from("inventory_transactions")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return res
      .status(404)
      .json({ error: "Inventory transaction not found or update failed" });

  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("inventory_transactions")
    .delete()
    .eq("id", id);

  if (error)
    return res
      .status(404)
      .json({ error: "Inventory transaction not found or delete failed" });

  res
    .status(200)
    .json({ message: "Inventory transaction deleted successfully" });
});

/**
 * @openapi
 * /api/v1/inventory_transactions/distributions/query:
 *   get:
 *     summary: Get class inventory distributions with optional filtering
 *     tags:
 *       - ClassInventoryDistributions
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by class ID
 *       - in: query
 *         name: session_term_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by session term ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of class inventory distributions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClassInventoryDistributionWithDetails'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @openapi
 * /api/v1/inventory_transactions/distributions:
 *   post:
 *     summary: Distribute inventory items to to the specified class
 *     tags:
 *       - ClassInventoryDistributions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInventoryDistributionInput'
 *     responses:
 *       201:
 *         description: Class inventory distribution created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassInventoryDistribution'
 */
router.get("/distributions/query", async (req: Request, res: Response) => {
  try {
    console.log("req.query", req.query);
    const { class_id, session_term_id, page = 1, limit = 10 } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build query with filters
    let query = supabase
      .from("class_inventory_distributions")
      .select(
        `
        *,
        school_classes(id, name),
        academic_session_terms(id, name, session),
        class_teachers(id, name),
        inventory_items(id, name, sku, cost_price, selling_price, categories(id, name))
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (class_id) {
      query = query.eq("class_id", class_id);
    }
    if (session_term_id) {
      query = query.eq("session_term_id", session_term_id);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("class_inventory_distributions")
      .select("*", { count: "exact", head: true });

    if (class_id) {
      countQuery = countQuery.eq("class_id", class_id);
    }
    if (session_term_id) {
      countQuery = countQuery.eq("session_term_id", session_term_id);
    }

    const { count } = await countQuery;

    // Get paginated data
    const { data, error } = await query.range(offset, offset + limitNum - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching class inventory distributions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/distributions", async (req: Request, res: Response) => {
  const body = req.body;
  console.log("body", body);
  if (
    !body.class_id ||
    !body.inventory_item_id ||
    !body.session_term_id ||
    !body.distributed_quantity ||
    !body.received_by
  ) {
    return res.status(400).json({
      error:
        "class_id, inventory_item_id, session_term_id, and distributed_quantity are required",
    });
  }

  if (body.distributed_quantity <= 0) {
    return res
      .status(400)
      .json({ error: "distributed_quantity must be greater than 0" });
  }
  const inventorySummary = await inventoryService.getInventorySummary(
    body.inventory_item_id
  );
  if (
    (inventorySummary?.current_stock ?? 0) <
    (Number(body.distributed_quantity) ?? 0)
  ) {
    return res
      .status(400)
      .json({ error: "Insufficient stock for the distribution" });
  }
  const insertData = {
    ...body,
    distribution_date: body.distribution_date || new Date().toISOString(),
    created_by: req.user?.id || body.created_by || "",
  };

  const { data, error } = await supabase
    .from("class_inventory_distributions")
    .insert([insertData])
    .select()
    .single();
  //i current stock of inventory transaction table for sale
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("inventory_transactions")
    .insert([
      {
        item_id: insertData.inventory_item_id,
        // receiver_id: insertData.received_by,
        transaction_type: "distribution",
        qty_out: insertData.distributed_quantity,
        out_cost: insertData?.out_cost || 0,
        status: "completed",
        reference_no: insertData?.reference_no,
        notes: insertData?.notes,
        transaction_date: insertData.distribution_date,
        created_by: insertData.created_by,
        distribution_id: data.id,
      },
    ])
    .select()
    .single();
  if (inventoryError)
    return res.status(500).json({ error: inventoryError.message });

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/inventory_transactions/distributions/{id}:
 *   put:
 *     summary: Update inventory distribution by ID
 *     tags:
 *       - ClassInventoryDistributions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInventoryDistributionInput'
 *     responses:
 *       200:
 *         description: Class inventory distribution updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassInventoryDistribution'
 *       404:
 *         description: Class inventory distribution not found
 */
router.put("/distributions/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  const { data, error } = await supabase
    .from("class_inventory_distributions")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return res.status(404).json({
      error: "Class inventory distribution not found or update failed",
    });
  }

  const { data: inventoryData, error: inventoryError } = await supabase
    .from("inventory_transactions")
    .update({
      qty_out: body.distributed_quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("distribution_id", id)
    .select()
    .single();
  if (inventoryError)
    return res.status(500).json({ error: inventoryError.message });

  res.json(data);
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ClassInventoryDistribution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         class_id:
 *           type: string
 *           format: uuid
 *         inventory_item_id:
 *           type: string
 *           format: uuid
 *         session_term_id:
 *           type: string
 *           format: uuid
 *         distributed_quantity:
 *           type: integer
 *         distribution_date:
 *           type: string
 *           format: date-time
 *         received_by:
 *           type: string
 *           format: uuid
 *         receiver_name:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ClassInventoryDistributionWithDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         class_id:
 *           type: string
 *           format: uuid
 *         inventory_item_id:
 *           type: string
 *           format: uuid
 *         session_term_id:
 *           type: string
 *           format: uuid
 *         distributed_quantity:
 *           type: integer
 *         distribution_date:
 *           type: string
 *           format: date-time
 *         received_by:
 *           type: string
 *           format: uuid
 *         receiver_name:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         school_classes:
 *           $ref: '#/components/schemas/SchoolClass'
 *         academic_session_terms:
 *           $ref: '#/components/schemas/AcademicSessionTerm'
 *         inventory_items:
 *           $ref: '#/components/schemas/InventoryItemWithCategory'
 *     SchoolClass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     AcademicSessionTerm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         session:
 *           type: string
 *     ClassInventoryDistributionInput:
 *       type: object
 *       required:
 *         - class_id
 *         - inventory_item_id
 *         - session_term_id
 *         - distributed_quantity
 *         - received_by
 *       properties:
 *         class_id:
 *           type: string
 *           format: uuid
 *         inventory_item_id:
 *           type: string
 *           format: uuid
 *         session_term_id:
 *           type: string
 *           format: uuid
 *         distributed_quantity:
 *           type: integer
 *         distribution_date:
 *           type: string
 *           format: date-time
 *         received_by:
 *           type: string
 *           format: uuid
 *         receiver_name:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 *     InventoryTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         item_id:
 *           type: string
 *           format: uuid
 *         supplier_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         receiver_id:
 *           type: string
 *           format: uuid
 *         supplier_receiver:
 *           type: string
 *           nullable: true
 *         transaction_type:
 *           type: string
 *           enum: [purchase, sale, distribution, return]
 *         qty_in:
 *           type: number
 *         in_cost:
 *           type: number
 *         qty_out:
 *           type: number
 *         out_cost:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, cancelled, deleted, completed]
 *         reference_no:
 *           type: string
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         transaction_date:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         inventory_items:
 *           $ref: '#/components/schemas/InventoryItemWithCategory'
 *         suppliers:
 *           $ref: '#/components/schemas/Supplier'
 *           nullable: true
 *     InventoryItemWithCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         categories:
 *           $ref: '#/components/schemas/Category'
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     InventoryTransactionInput:
 *       type: object
 *       required:
 *         - item_id
 *         - transaction_type
 *       properties:
 *         item_id:
 *           type: string
 *           format: uuid
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         receiver_id:
 *           type: string
 *           format: uuid
 *         supplier_receiver:
 *           type: string
 *         transaction_type:
 *           type: string
 *           enum: [purchase, sale, distribution, return]
 *         qty_in:
 *           type: number
 *         in_cost:
 *           type: number
 *         qty_out:
 *           type: number
 *         out_cost:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, cancelled, deleted, completed]
 *         reference_no:
 *           type: string
 *         notes:
 *           type: string
 *         transaction_date:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *           format: uuid
 */

export default router;
