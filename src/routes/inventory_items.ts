import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/inventory_items:
 *   get:
 *     summary: Get all inventory items
 *     tags:
 *       - InventoryItems
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by category ID
 *       - in: query
 *         name: sub_category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by sub-category ID
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by brand ID
 *     responses:
 *       200:
 *         description: List of inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *   post:
 *     summary: Create a new inventory item
 *     tags:
 *       - InventoryItems
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category_id
 *               - uom_id
 *               - cost_price
 *               - selling_price
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               sub_category_id:
 *                 type: string
 *                 format: uuid
 *               brand_id:
 *                 type: string
 *                 format: uuid
 *               uom_id:
 *                 type: string
 *                 format: uuid
 *               barcode:
 *                 type: string
 *               cost_price:
 *                 type: number
 *               selling_price:
 *                 type: number
 *               created_by:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Inventory item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 */
router.get("/", async (req: Request, res: Response) => {
  const { category_id, sub_category_id, brand_id } = req.query;
  let query = supabase
    .from("inventory_items")
    .select(
      `*, categories(id, name),sub_categories(id, name), uoms(id, name), brands(id, name)`
    );
  if (category_id) query = query.eq("category_id", category_id);
  if (sub_category_id) query = query.eq("sub_category_id", sub_category_id);
  if (brand_id) query = query.eq("brand_id", brand_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const {
    sku,
    name,
    category_id,
    sub_category_id,
    brand_id,
    uom_id,
    barcode,
    cost_price,
    selling_price,
  } = req.body;

  if (!name || !category_id)
    return res.status(400).json({ error: "Missing required fields" });
  const { data, error } = await supabase
    .from("inventory_items")
    .insert([
      {
        sku,
        name,
        category_id,
        sub_category_id,
        brand_id,
        uom_id,
        barcode,
        cost_price,
        selling_price,
        created_by: req.user?.id || "",
      },
    ])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/inventory_items/{id}:
 *   get:
 *     summary: Get an inventory item by ID
 *     tags:
 *       - InventoryItems
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Inventory item not found
 *   put:
 *     summary: Update an inventory item by ID
 *     tags:
 *       - InventoryItems
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
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               sub_category_id:
 *                 type: string
 *                 format: uuid
 *               brand_id:
 *                 type: string
 *                 format: uuid
 *               uom_id:
 *                 type: string
 *                 format: uuid
 *               barcode:
 *                 type: string
 *               cost_price:
 *                 type: number
 *               selling_price:
 *                 type: number
 *               created_by:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Inventory item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Inventory item not found
 *   delete:
 *     summary: Delete an inventory item by ID
 *     tags:
 *       - InventoryItems
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Inventory item deleted
 *       404:
 *         description: Inventory item not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Inventory item not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    sku,
    name,
    category_id,
    sub_category_id,
    brand_id,
    uom_id,
    barcode,
    cost_price,
    selling_price,
    created_by,
  } = req.body;
  const { data, error } = await supabase
    .from("inventory_items")
    .update({
      sku,
      name,
      category_id,
      sub_category_id,
      brand_id,
      uom_id,
      barcode,
      cost_price,
      selling_price,
      created_by,
    })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Inventory item not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id);
  if (error)
    return res
      .status(404)
      .json({ error: "Inventory item not found or delete failed" });
  res.status(200).json({ message: "Inventory item deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         category_id:
 *           type: string
 *           format: uuid
 *         sub_category_id:
 *           type: string
 *           format: uuid
 *         brand_id:
 *           type: string
 *           format: uuid
 *         uom_id:
 *           type: string
 *           format: uuid
 *         barcode:
 *           type: string
 *         cost_price:
 *           type: number
 *         selling_price:
 *           type: number
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
