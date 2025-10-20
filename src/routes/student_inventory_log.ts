import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/student_inventory_collection:
 *   get:
 *     summary: Get all student inventory logs
 *     tags:
 *       - StudentInventoryCollection
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by student_id
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by class_id
 *       - in: query
 *         name: session_term_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by session_term_id
 *       - in: query
 *         name: inventory_item_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by inventory_item_id
 *       - in: query
 *         name: eligible
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by eligible status
 *       - in: query
 *         name: received
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by received status
 *     responses:
 *       200:
 *         description: List of student inventory logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentInventoryCollection'
 *   post:
 *     summary: Create a new student inventory collection
 *     tags:
 *       - StudentInventoryCollection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInventoryCollectionInput'
 *     responses:
 *       201:
 *         description: Student inventory collection created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryCollection'
 */
router.get("/", async (req: Request, res: Response) => {
  const {
    student_id,
    class_id,
    session_term_id,
    inventory_item_id,
    eligible,
    received,
  } = req.query;
  let query = supabase.from("student_inventory_log").select(`
    *,
    students(id, first_name, last_name, admission_number),
    school_classes(id, name),
    academic_session_terms(id, name),
    inventory_items(id, name, categories(id, name))
  `);
  if (student_id) query = query.eq("student_id", student_id);
  if (class_id) query = query.eq("class_id", class_id);
  if (session_term_id) query = query.eq("session_term_id", session_term_id);
  if (inventory_item_id)
    query = query.eq("inventory_item_id", inventory_item_id);
  if (eligible !== undefined) query = query.eq("eligible", eligible === "true");
  if (received !== undefined) query = query.eq("received", received === "true");
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Single create endpoint
router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.student_id ||
    !body.class_id ||
    !body.session_term_id ||
    !body.inventory_item_id ||
    body.qty === undefined ||
    body.qty === null
  ) {
    return res.status(400).json({
      error:
        "student_id, class_id, session_term_id, inventory_item_id, and qty are required",
    });
  }
  if (body.qty <= 0) {
    return res.status(400).json({ error: "qty must be greater than 0" });
  }
  if (!req.user?.teacher_id) {
    return res.status(400).json({
      error:
        "You are not authorized to perform this action. You must be a teacher to perform this action",
    });
  }
  const { data, error } = await supabase
    .from("student_inventory_log")
    .insert([
      { ...body, created_by: req.user?.id, given_by: req.user?.teacher_id },
    ])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/student_inventory_collection/bulk_upsert:
 *   post:
 *     summary: Bulk upsert student inventory collections
 *     tags:
 *       - StudentInventoryCollection
 *     description: Upsert (insert or update) multiple student inventory collections at once. Records are matched on (student_id, class_id, session_term_id, inventory_item_id).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/StudentInventoryCollectionInput'
 *     responses:
 *       200:
 *         description: Bulk upserted student inventory collections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentInventoryCollection'
 */
router.post("/bulk_upsert", async (req: Request, res: Response) => {
  const records = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res
      .status(400)
      .json({ error: "Request body must be a non-empty array" });
  }
  // Validate each record
  if (!req.user?.teacher_id) {
    return res.status(400).json({
      error:
        "You are not authorized to perform this action. You must be a teacher to perform this action",
    });
  }
  const finalRecords = records.map((rec) => ({
    ...rec,
    created_by: req.user?.id,
    given_by: req.user?.teacher_id,
  }));
  console.log("finalRecords", finalRecords);
  for (const rec of finalRecords) {
    if (
      !rec.student_id ||
      !rec.class_id ||
      !rec.session_term_id ||
      !rec.inventory_item_id ||
      rec.qty === undefined ||
      rec.qty === null
    ) {
      return res.status(400).json({
        error:
          "Each record must have student_id, class_id, session_term_id, inventory_item_id, and qty",
      });
    }
    if (rec.qty <= 0) {
      return res.status(400).json({
        error: "qty must be greater than 0 for all records",
      });
    }
  }
  // Upsert using Supabase (PostgREST) - match on unique constraint
  const { data, error } = await supabase
    .from("student_inventory_log")
    .upsert(finalRecords)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @openapi
 * /api/v1/student_inventory_collection/{id}:
 *   get:
 *     summary: Get a student inventory collection by ID
 *     tags:
 *       - StudentInventoryCollection
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student inventory collection found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryCollection'
 *       404:
 *         description: Student inventory collection not found
 *   put:
 *     summary: Update a student inventory collection by ID
 *     tags:
 *       - StudentInventoryCollection
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
 *             $ref: '#/components/schemas/StudentInventoryCollectionInput'
 *     responses:
 *       200:
 *         description: Student inventory collection updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentInventoryCollection'
 *       404:
 *         description: Student inventory collection not found
 *   delete:
 *     summary: Delete a student inventory collection by ID
 *     tags:
 *       - StudentInventoryCollection
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Student inventory collection deleted
 *       404:
 *         description: Student inventory collection not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("student_inventory_log")
    .select(
      `
      *,
      students(id, first_name, last_name, admission_number),
      school_classes(id, name),
      academic_session_terms(id, name),
      inventory_items(id, name, categories(id, name))
    `
    )
    .eq("id", id)
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Student inventory collection not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { received, received_date, qty, student_id, inventory_item_id } =
    req.body;

  const { data, error } = await supabase
    .from("student_inventory_log")
    .update({ received, received_date, qty, student_id, inventory_item_id })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res.status(404).json({
      error: "Student inventory collection not found or update failed",
    });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("student_inventory_log")
    .delete()
    .eq("id", id);
  if (error)
    return res.status(404).json({
      error: "Student inventory collection not found or delete failed",
    });
  res
    .status(200)
    .json({ message: "Student inventory collection deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     StudentInventoryCollection:
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
 *           nullable: true
 *         given_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         students:
 *           $ref: '#/components/schemas/Student'
 *         school_classes:
 *           $ref: '#/components/schemas/SchoolClass'
 *         academic_session_terms:
 *           $ref: '#/components/schemas/AcademicSessionTerm'
 *         inventory_items:
 *           $ref: '#/components/schemas/InventoryItemWithCategory'
 *     StudentInventoryCollectionInput:
 *       type: object
 *       required:
 *         - student_id
 *         - class_id
 *         - session_term_id
 *         - inventory_item_id
 *         - qty
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
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         admission_number:
 *           type: string
 *     SchoolClass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     AcademicSessionTerm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     InventoryItemWithCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         categories:
 *           $ref: '#/components/schemas/Category'
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 */
