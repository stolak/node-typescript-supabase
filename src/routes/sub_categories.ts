import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/sub_categories:
 *   get:
 *     summary: Get all sub-categories
 *     tags:
 *       - SubCategories
 *     responses:
 *       200:
 *         description: List of sub-categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubCategory'
 *   post:
 *     summary: Create a new sub-category
 *     tags:
 *       - SubCategories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Sub-category created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("sub_categories")
    .select(`*, categories(id, name)`);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, category_id } = req.body;
  if (!name || !category_id)
    return res.status(400).json({ error: "Name and category_id are required" });
  const { data, error } = await supabase
    .from("sub_categories")
    .insert([{ name, category_id }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/sub_categories/{id}:
 *   get:
 *     summary: Get a sub-category by ID
 *     tags:
 *       - SubCategories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Sub-category not found
 *   put:
 *     summary: Update a sub-category by ID
 *     tags:
 *       - SubCategories
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
 *               category_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Sub-category updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Sub-category not found
 *   delete:
 *     summary: Delete a sub-category by ID
 *     tags:
 *       - SubCategories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Sub-category deleted
 *       404:
 *         description: Sub-category not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Sub-category not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category_id } = req.body;
  const { data, error } = await supabase
    .from("sub_categories")
    .update({ name, category_id })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Sub-category not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("sub_categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete sub-category because it is still in use by other records.",
      });
    }

    return res
      .status(500)
      .json({
        error: "An unexpected error occurred while deleting sub-category.",
      });
  }
  res.status(200).json({ message: "Sub-category deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     SubCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         category_id:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
