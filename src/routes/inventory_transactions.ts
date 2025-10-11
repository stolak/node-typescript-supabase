import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/inventory_transactions:
 *   get:
 *     summary: Get all inventory transactions
 *     tags:
 *       - InventoryTransactions
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
 *     summary: Create a new inventory transaction (purchase or sale)
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
router.post("/distributions", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.class_id ||
    !body.inventory_item_id ||
    !body.session_term_id ||
    !body.distributed_quantity
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
        receiver_id: insertData.received_by,
        transaction_type: "sale",
        qty_out: insertData.distributed_quantity,
        out_cost: insertData?.out_cost || 0,
        status: "completed",
        reference_no: insertData?.reference_no,
        notes: insertData?.notes,
        transaction_date: insertData.distribution_date,
        created_by: insertData.created_by,
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
 *     ClassInventoryDistributionInput:
 *       type: object
 *       required:
 *         - class_id
 *         - inventory_item_id
 *         - session_term_id
 *         - distributed_quantity
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
 *           enum: [purchase, sale]
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
 *           enum: [purchase, sale]
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
