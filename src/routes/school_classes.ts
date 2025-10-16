import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/school_classes:
 *   get:
 *     summary: Get all school classes
 *     tags:
 *       - SchoolClasses
 *     responses:
 *       200:
 *         description: List of school classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SchoolClass'
 *   post:
 *     summary: Create a new school class
 *     tags:
 *       - SchoolClasses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolClassInput'
 *     responses:
 *       201:
 *         description: School class created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolClass'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("school_classes").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.status) {
    return res.status(400).json({ error: "name and status are required" });
  }
  const { data, error } = await supabase
    .from("school_classes")
    .insert([{ ...body, created_by: req.user?.id }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/school_classes/{id}:
 *   get:
 *     summary: Get a school class by ID
 *     tags:
 *       - SchoolClasses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School class found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolClass'
 *       404:
 *         description: School class not found
 *   put:
 *     summary: Update a school class by ID
 *     tags:
 *       - SchoolClasses
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
 *             $ref: '#/components/schemas/SchoolClassInput'
 *     responses:
 *       200:
 *         description: School class updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolClass'
 *       404:
 *         description: School class not found
 *   delete:
 *     summary: Delete a school class by ID
 *     tags:
 *       - SchoolClasses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: School class deleted
 *       404:
 *         description: School class not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("school_classes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "School class not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("school_classes")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "School class not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("school_classes").delete().eq("id", id);
  if (error)
    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete school class because it is still in use by other records.",
      });
    }
  return res
    .status(404)
    .json({ error: "School class not found or delete failed" });
  res.status(200).json({ message: "School class deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     SchoolClass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     SchoolClassInput:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 */
