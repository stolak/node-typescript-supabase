import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/uoms:
 *   get:
 *     summary: Get all units of measure
 *     tags:
 *       - UOMs
 *     responses:
 *       200:
 *         description: List of units of measure
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UOM'
 *   post:
 *     summary: Create a new unit of measure
 *     tags:
 *       - UOMs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Unit of measure created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UOM'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("uoms").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, symbol } = req.body;
  if (!name || !symbol)
    return res.status(400).json({ error: "Name and symbol are required" });
  const { data, error } = await supabase
    .from("uoms")
    .insert([{ name, symbol }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/uoms/{id}:
 *   get:
 *     summary: Get a unit of measure by ID
 *     tags:
 *       - UOMs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit of measure found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UOM'
 *       404:
 *         description: Unit of measure not found
 *   put:
 *     summary: Update a unit of measure by ID
 *     tags:
 *       - UOMs
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
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unit of measure updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UOM'
 *       404:
 *         description: Unit of measure not found
 *   delete:
 *     summary: Delete a unit of measure by ID
 *     tags:
 *       - UOMs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Unit of measure deleted
 *       404:
 *         description: Unit of measure not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("uoms")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return res.status(404).json({ error: "Unit of measure not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, symbol } = req.body;
  const { data, error } = await supabase
    .from("uoms")
    .update({ name, symbol })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Unit of measure not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("uoms").delete().eq("id", id);
  if (error)
    return res
      .status(404)
      .json({ error: "Unit of measure not found or delete failed" });
  res.status(200).json({ message: "Unit of measure deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     UOM:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         symbol:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
