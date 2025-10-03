import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/class_inventory_entitlements:
 *   get:
 *     summary: Get all class inventory entitlements
 *     tags:
 *       - ClassInventoryEntitlements
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by class_id
 *       - in: query
 *         name: inventory_item_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by inventory_item_id
 *       - in: query
 *         name: session_term_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by session_term_id
 *     responses:
 *       200:
 *         description: List of class inventory entitlements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ClassInventoryEntitlement'
 *   post:
 *     summary: Create a new class inventory entitlement
 *     tags:
 *       - ClassInventoryEntitlements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInventoryEntitlementInput'
 *     responses:
 *       201:
 *         description: Class inventory entitlement created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassInventoryEntitlement'
 */
router.get("/", async (req: Request, res: Response) => {
  const { class_id, inventory_item_id, session_term_id } = req.query;
  let query = supabase.from("class_inventory_entitlements").select("*");
  if (class_id) query = query.eq("class_id", class_id);
  if (inventory_item_id)
    query = query.eq("inventory_item_id", inventory_item_id);
  if (session_term_id) query = query.eq("session_term_id", session_term_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Single create endpoint (unchanged)
router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.class_id ||
    !body.inventory_item_id ||
    !body.session_term_id ||
    body.quantity === undefined ||
    body.quantity === null
  ) {
    return res.status(400).json({
      error:
        "class_id, inventory_item_id, session_term_id, quantity, and created_by are required",
    });
  }
  const { data, error } = await supabase
    .from("class_inventory_entitlements")
    .insert([{ ...body, created_by: req.user?.id }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/class_inventory_entitlements/bulk_upsert:
 *   post:
 *     summary: Bulk upsert class inventory entitlements
 *     tags:
 *       - ClassInventoryEntitlements
 *     description: Upsert (insert or update) multiple class inventory entitlements at once. Records are matched on (class_id, inventory_item_id, session_term_id).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ClassInventoryEntitlementInput'
 *     responses:
 *       200:
 *         description: Bulk upserted class inventory entitlements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ClassInventoryEntitlement'
 */
router.post("/bulk_upsert", async (req: Request, res: Response) => {
  const records = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res
      .status(400)
      .json({ error: "Request body must be a non-empty array" });
  }
  // Validate each record
  const finalRecords = records.map((rec) => ({
    ...rec,
    created_by: req.user?.id,
  }));
  for (const rec of finalRecords) {
    if (
      !rec.class_id ||
      !rec.inventory_item_id ||
      !rec.session_term_id ||
      rec.quantity === undefined ||
      rec.quantity === null
    ) {
      return res.status(400).json({
        error:
          "Each record must have class_id, inventory_item_id, session_term_id, and quantity",
      });
    }
  }
  // Upsert using Supabase (PostgREST) - match on unique constraint
  const { data, error } = await supabase
    .from("class_inventory_entitlements")
    .upsert(finalRecords, {
      onConflict: "class_id,inventory_item_id,session_term_id",
    })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @openapi
 * /api/v1/class_inventory_entitlements/{id}:
 *   get:
 *     summary: Get a class inventory entitlement by ID
 *     tags:
 *       - ClassInventoryEntitlements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class inventory entitlement found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassInventoryEntitlement'
 *       404:
 *         description: Class inventory entitlement not found
 *   put:
 *     summary: Update a class inventory entitlement by ID
 *     tags:
 *       - ClassInventoryEntitlements
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
 *             $ref: '#/components/schemas/ClassInventoryEntitlementInput'
 *     responses:
 *       200:
 *         description: Class inventory entitlement updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassInventoryEntitlement'
 *       404:
 *         description: Class inventory entitlement not found
 *   delete:
 *     summary: Delete a class inventory entitlement by ID
 *     tags:
 *       - ClassInventoryEntitlements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Class inventory entitlement deleted
 *       404:
 *         description: Class inventory entitlement not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("class_inventory_entitlements")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Class inventory entitlement not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("class_inventory_entitlements")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res.status(404).json({
      error: "Class inventory entitlement not found or update failed",
    });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("class_inventory_entitlements")
    .delete()
    .eq("id", id);
  if (error)
    return res.status(404).json({
      error: "Class inventory entitlement not found or delete failed",
    });
  res
    .status(200)
    .json({ message: "Class inventory entitlement deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     ClassInventoryEntitlement:
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
 *         quantity:
 *           type: integer
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
 *     ClassInventoryEntitlementInput:
 *       type: object
 *       required:
 *         - class_id
 *         - inventory_item_id
 *         - session_term_id
 *         - quantity
 *         - created_by
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
 *         quantity:
 *           type: integer
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 */
