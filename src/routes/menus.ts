/**
 * Routes for managing menus.
 */
import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/menus:
 *   get:
 *     summary: Get all menus
 *     tags:
 *       - Menus
 *     responses:
 *       200:
 *         description: List of menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 *   post:
 *     summary: Create a new menu entry
 *     tags:
 *       - Menus
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - route
 *               - caption
 *             properties:
 *               route:
 *                 type: string
 *                 description: Unique identifier for the menu route
 *               caption:
 *                 type: string
 *                 description: User-facing caption for the menu
 *     responses:
 *       201:
 *         description: Menu created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Route already exists
 */
router
  .route("/")
  .get(async (_req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("caption");

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  })
  .post(async (req: Request, res: Response) => {
    const { route, caption } = req.body ?? {};

    if (!route || !caption) {
      return res.status(400).json({ error: "route and caption are required" });
    }

    const { data, error } = await supabase
      .from("menus")
      .insert([{ route, caption }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "route already exists" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  });

/**
 * @openapi
 * /api/v1/menus/{id}:
 *   get:
 *     summary: Get a menu by ID
 *     tags:
 *       - Menus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menu found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 *   put:
 *     summary: Update a menu by ID
 *     tags:
 *       - Menus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               route:
 *                 type: string
 *               caption:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 *   delete:
 *     summary: Delete a menu by ID
 *     tags:
 *       - Menus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Menu deleted
 *       404:
 *         description: Menu not found
 */
router
  .route("/:id")
  .get(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Menu not found" });

    res.json(data);
  })
  .put(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { route, caption } = req.body ?? {};

    const updateData: Record<string, unknown> = {};
    if (route !== undefined) updateData.route = route;
    if (caption !== undefined) updateData.caption = caption;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const { data, error } = await supabase
      .from("menus")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "route already exists" });
      }
      return res.status(404).json({ error: "Menu not found or update failed" });
    }

    res.json(data);
  })
  .delete(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("menus")
      .delete()
      .eq("id", id)
      .select();

    if (error || !data?.length) {
      return res.status(404).json({ error: "Menu not found or delete failed" });
    }

    res.status(204).send();
  });

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         route:
 *           type: string
 *         caption:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
