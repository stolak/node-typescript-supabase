import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/roles:
 *   get:
 *     summary: Get all roles
 *     tags:
 *       - Roles
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *   post:
 *     summary: Create a new role
 *     tags:
 *       - Roles
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
 *               status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       400:
 *         description: Missing required fields
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("roles").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const sanitizedCode = name.trim().replace(/\s+/g, "_").toUpperCase();
  const { data, error } = await supabase
    .from("roles")
    .insert([{ code: sanitizedCode, name, status }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/roles/{code}:
 *   get:
 *     summary: Get a role by code
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *   put:
 *     summary: Update a role by code
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: code
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *   delete:
 *     summary: Delete a role by code
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 */
router.get("/:code", async (req: Request, res: Response) => {
  const { code } = req.params;
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("code", code)
    .single();

  if (error) return res.status(404).json({ error: "Role not found" });
  res.json(data);
});

router.put("/:code", async (req: Request, res: Response) => {
  const { code } = req.params;
  const { name, status } = req.body;

  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from("roles")
    .update(updateData)
    .eq("code", code)
    .select()
    .single();

  if (error)
    return res.status(404).json({ error: "Role not found or update failed" });
  res.json(data);
});

router.delete("/:code", async (req: Request, res: Response) => {
  const { code } = req.params;
  const { error } = await supabase.from("roles").delete().eq("code", code);

  if (error)
    return res.status(404).json({ error: "Role not found or delete failed" });

  res.status(204).send();
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
