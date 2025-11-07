import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/brands:
 *   get:
 *     summary: Get all brands
 *     tags:
 *       - Brands
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 *   post:
 *     summary: Create a new brand
 *     tags:
 *       - Brands
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brand created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 */
router.get("/", async (_req: Request, res: Response) => {
  console.log(_req);
  const { data, error } = await supabase.from("brands").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const { data, error } = await supabase
    .from("brands")
    .insert([{ name }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Get a brand by ID
 *     tags:
 *       - Brands
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 *   put:
 *     summary: Update a brand by ID
 *     tags:
 *       - Brands
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
 *     responses:
 *       200:
 *         description: Brand updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 *   delete:
 *     summary: Delete a brand by ID
 *     tags:
 *       - Brands
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Brand deleted
 *       404:
 *         description: Brand not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  console.log(req);
  const { id } = req.params;
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Brand not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const { data, error } = await supabase
    .from("brands")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res.status(404).json({ error: "Brand not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete brand because it is still in use by other records.",
      });
    }

    return res
      .status(500)
      .json({ error: "An unexpected error occurred while deleting brand." });
  }
  res.status(200).json({ message: "Brand deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
