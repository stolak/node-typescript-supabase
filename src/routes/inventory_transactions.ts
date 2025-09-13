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
    .select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.item_id || !body.transaction_type || !body.created_by) {
    return res.status(400).json({
      error: "item_id, transaction_type, and created_by are required",
    });
  }
  if (!["purchase", "sale"].includes(body.transaction_type)) {
    return res
      .status(400)
      .json({ error: "transaction_type must be 'purchase' or 'sale'" });
  }
  if (
    body.transaction_type === "sale" &&
    (body.qty_out === undefined || body.qty_out === null || body.qty_out === 0)
  ) {
    return res.status(400).json({ error: "qty_out is required for sales" });
  }
  if (
    body.transaction_type === "purchase" &&
    (body.qty_in === undefined || body.qty_in === null || body.qty_in === 0)
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
    .insert([{ ...body, created_by: req.user?.id || "" }])
    .select()
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
    .select("*")
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
  res.status(204).send();
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
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
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
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
