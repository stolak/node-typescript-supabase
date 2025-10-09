import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/academic_session_terms:
 *   get:
 *     summary: Get all academic session terms
 *     tags:
 *       - AcademicSessionTerms
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         required: false
 *         description: Filter by academic session term status
 *     responses:
 *       200:
 *         description: List of academic session terms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicSessionTerm'
 *   post:
 *     summary: Create a new academic session term
 *     tags:
 *       - AcademicSessionTerms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicSessionTermInput'
 *     responses:
 *       201:
 *         description: Academic session term created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicSessionTerm'
 */
router.get("/", async (req: Request, res: Response) => {
  const { status } = req.query;
  let query = supabase.from("academic_session_terms").select(`*`);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.session ||
    !body.name ||
    !body.start_date ||
    !body.end_date ||
    !body.status
  ) {
    return res.status(400).json({
      error: "session, name, start_date, end_date, and status are required",
    });
  }
  const { data, error } = await supabase
    .from("academic_session_terms")
    .insert([{ ...body }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/academic_session_terms/{id}:
 *   get:
 *     summary: Get an academic session term by ID
 *     tags:
 *       - AcademicSessionTerms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic session term found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicSessionTerm'
 *       404:
 *         description: Academic session term not found
 *   put:
 *     summary: Update an academic session term by ID
 *     tags:
 *       - AcademicSessionTerms
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
 *             $ref: '#/components/schemas/AcademicSessionTermInput'
 *     responses:
 *       200:
 *         description: Academic session term updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicSessionTerm'
 *       404:
 *         description: Academic session term not found
 *   delete:
 *     summary: Delete an academic session term by ID
 *     tags:
 *       - AcademicSessionTerms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Academic session term deleted
 *       404:
 *         description: Academic session term not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("academic_session_terms")
    .select(`*`)
    .eq("id", id)
    .single();
  if (error)
    return res.status(404).json({ error: "Academic session term not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("academic_session_terms")
    .update({ ...body })
    .eq("id", id)
    .select(`*`)
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Academic session term not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("academic_session_terms")
    .delete()
    .eq("id", id);
  if (error)
    return res
      .status(404)
      .json({ error: "Academic session term not found or delete failed" });
  res.status(204).send();
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     AcademicSessionTerm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         session:
 *           type: string
 *         name:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *         created_at:
 *           type: string
 *           format: date-time
 *     AcademicSessionTermInput:
 *       type: object
 *       required:
 *         - session
 *         - name
 *         - start_date
 *         - end_date
 *         - status
 *       properties:
 *         session:
 *           type: string
 *         name:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 */
