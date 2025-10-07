import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/students:
 *   get:
 *     summary: Get all students
 *     tags:
 *       - Students
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, graduated, transferred, suspended, archived]
 *         required: false
 *         description: Filter by student status
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter by class ID
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         required: false
 *         description: Filter by gender
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *   post:
 *     summary: Create a new student
 *     tags:
 *       - Students
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 */
router.get("/", async (req: Request, res: Response) => {
  const { status, class_id, gender } = req.query;
  let query = supabase.from("students").select(`*, school_classes(id, name)`);
  if (status) query = query.eq("status", status);
  if (class_id) query = query.eq("class_id", class_id);
  if (gender) query = query.eq("gender", gender);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.admission_number ||
    !body.first_name ||
    !body.last_name ||
    !body.gender ||
    !body.date_of_birth
  ) {
    return res.status(400).json({
      error:
        "admission_number, first_name, last_name, gender, date_of_birth, and created_by are required",
    });
  }
  if (!["male", "female", "other"].includes(body.gender)) {
    return res
      .status(400)
      .json({ error: "gender must be 'male', 'female', or 'other'" });
  }
  const { data, error } = await supabase
    .from("students")
    .insert([{ ...body, created_by: req.user?.id || body?.created_by || "" }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags:
 *       - Students
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *   put:
 *     summary: Update a student by ID
 *     tags:
 *       - Students
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
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Student updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *   delete:
 *     summary: Delete a student by ID
 *     tags:
 *       - Students
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Student deleted
 *       404:
 *         description: Student not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Student not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("students")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Student not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error)
    return res
      .status(404)
      .json({ error: "Student not found or delete failed" });
  res.status(200).json({ message: "Student deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         admission_number:
 *           type: string
 *         first_name:
 *           type: string
 *         middle_name:
 *           type: string
 *         last_name:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         date_of_birth:
 *           type: string
 *           format: date
 *         class_id:
 *           type: string
 *           format: uuid
 *         guardian_name:
 *           type: string
 *         guardian_contact:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, graduated, transferred, suspended, archived]
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     StudentInput:
 *       type: object
 *       required:
 *         - admission_number
 *         - first_name
 *         - last_name
 *         - gender
 *         - date_of_birth
 *         - status
 *         - created_by
 *       properties:
 *         admission_number:
 *           type: string
 *         first_name:
 *           type: string
 *         middle_name:
 *           type: string
 *         last_name:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         date_of_birth:
 *           type: string
 *           format: date
 *         class_id:
 *           type: string
 *           format: uuid
 *         guardian_name:
 *           type: string
 *         guardian_contact:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, graduated, transferred, suspended, archived]
 *         created_by:
 *           type: string
 *           format: uuid
 */
