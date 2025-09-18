import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/student_inventory_log:
 *   get:
 *     summary: Get all student inventory logs
 *     tags:
 *       - StudentInventoryLog
 *     responses:
 *       200:
 *         description: List of student inventory logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentInventoryLog'
 *   post:
 *     summary: Create a new student inventory log
 *     tags:
 *       - StudentInventoryLog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInventoryLogInput'
 *     responses:
 *       201:
 *         description: Student inventory log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryLog'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("student_inventory_log")
    .select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.student_id ||
    !body.class_id ||
    !body.session_term_id ||
    !body.inventory_item_id ||
    !body.qty ||
    !body.created_by
  ) {
    return res.status(400).json({
      error:
        "student_id, class_id, session_term_id, inventory_item_id, qty, and created_by are required",
    });
  }
  if (body.qty <= 0) {
    return res.status(400).json({ error: "qty must be greater than 0" });
  }
  const insertData = {
    ...body,
    created_by: req.user?.id || body.created_by,
  };
  const { data, error } = await supabase
    .from("student_inventory_log")
    .insert([insertData])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/student_inventory_log/{id}:
 *   get:
 *     summary: Get a student inventory log by ID
 *     tags:
 *       - StudentInventoryLog
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student inventory log found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryLog'
 *       404:
 *         description: Student inventory log not found
 *   put:
 *     summary: Update a student inventory log by ID
 *     tags:
 *       - StudentInventoryLog
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
 *             $ref: '#/components/schemas/StudentInventoryLogInput'
 *     responses:
 *       200:
 *         description: Student inventory log updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryLog'
 *       404:
 *         description: Student inventory log not found
 *   delete:
 *     summary: Delete a student inventory log by ID
 *     tags:
 *       - StudentInventoryLog
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Student inventory log deleted
 *       404:
 *         description: Student inventory log not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("student_inventory_log")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return res.status(404).json({ error: "Student inventory log not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("student_inventory_log")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Student inventory log not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("student_inventory_log")
    .delete()
    .eq("id", id);
  if (error)
    return res
      .status(404)
      .json({ error: "Student inventory log not found or delete failed" });
  res.status(204).send();
});

/**
 * @openapi
 * /api/v1/student_inventory_log/bulk_upsert:
 *   post:
 *     summary: Bulk upsert student inventory logs
 *     tags:
 *       - StudentInventoryLog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/StudentInventoryLogInput'
 *     responses:
 *       200:
 *         description: Bulk upserted student inventory logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentInventoryLog'
 */
router.post("/bulk_upsert", async (req: Request, res: Response) => {
  const records = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res
      .status(400)
      .json({ error: "Request body must be a non-empty array" });
  }
  for (const rec of records) {
    if (
      !rec.student_id ||
      !rec.class_id ||
      !rec.session_term_id ||
      !rec.inventory_item_id ||
      !rec.qty ||
      !rec.created_by
    ) {
      return res.status(400).json({
        error:
          "Each record must have student_id, class_id, session_term_id, inventory_item_id, qty, and created_by",
      });
    }
    if (rec.qty <= 0) {
      return res
        .status(400)
        .json({ error: "qty must be greater than 0 for all records" });
    }
  }
  const now = new Date().toISOString();
  const upsertData = records.map((rec) => ({
    ...rec,
    created_by: rec.created_by, // req.user?.id || rec.created_by
    updated_at: now,
  }));
  // Upsert on (student_id, session_term_id, inventory_item_id)
  const { data, error } = await supabase
    .from("student_inventory_log")
    .upsert(upsertData, {
      onConflict: "student_id,session_term_id,inventory_item_id",
    })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @openapi
 * components:
 *   schemas:
 *     StudentInventoryLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         student_id:
 *           type: string
 *           format: uuid
 *         class_id:
 *           type: string
 *           format: uuid
 *         session_term_id:
 *           type: string
 *           format: uuid
 *         inventory_item_id:
 *           type: string
 *           format: uuid
 *         qty:
 *           type: integer
 *         eligible:
 *           type: boolean
 *         received:
 *           type: boolean
 *         received_date:
 *           type: string
 *           format: date-time
 *         given_by:
 *           type: string
 *           format: uuid
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     StudentInventoryLogInput:
 *       type: object
 *       required:
 *         - student_id
 *         - class_id
 *         - session_term_id
 *         - inventory_item_id
 *         - qty
 *         - created_by
 *       properties:
 *         student_id:
 *           type: string
 *           format: uuid
 *         class_id:
 *           type: string
 *           format: uuid
 *         session_term_id:
 *           type: string
 *           format: uuid
 *         inventory_item_id:
 *           type: string
 *           format: uuid
 *         qty:
 *           type: integer
 *         eligible:
 *           type: boolean
 *         received:
 *           type: boolean
 *         received_date:
 *           type: string
 *           format: date-time
 *         given_by:
 *           type: string
 *           format: uuid
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
