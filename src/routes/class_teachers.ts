import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/class_teachers:
 *   get:
 *     summary: Get all class teachers
 *     tags:
 *       - ClassTeachers
 *     responses:
 *       200:
 *         description: List of class teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ClassTeacher'
 *   post:
 *     summary: Create a new class teacher
 *     tags:
 *       - ClassTeachers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassTeacherInput'
 *     responses:
 *       201:
 *         description: Class teacher created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassTeacher'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("class_teachers").select(`
    *,
    school_classes(id, name)
   
  `);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.email || !body.name) {
    return res.status(400).json({ error: "email and name are required" });
  }
  // Check if user exists in auth.users
  const { data: user, error: userError } =
    await supabase.auth.admin.listUsers();
  const existingUser = user.users?.find((u) => u.email === body.email);
  if (userError && userError.code !== "PGRST116") {
    return res.status(500).json({ error: userError.message });
  }
  if (existingUser) {
    return res
      .status(400)
      .json({ error: "User with this email already exists" });
  }
  // check if user with email exists in class_teachers
  const { data: existingClassTeacher, error: classTeacherError } =
    await supabase
      .from("class_teachers")
      .select(`*, school_classes(id, name)`)
      .eq("email", body.email)
      .single();
  if (classTeacherError && classTeacherError.code !== "PGRST116") {
    return res.status(500).json({ error: classTeacherError.message });
  }
  if (existingClassTeacher) {
    return res
      .status(400)
      .json({ error: "Class teacher with this email already exists" });
  }
  // Create user in auth
  const { data: newUser, error: createUserError } =
    await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || Math.random().toString(36).slice(-8),
      user_metadata: { name: body.name, roles: ["teacher"] },
    });
  if (createUserError) {
    return res.status(500).json({ error: createUserError.message });
  }
  // Insert class_teacher
  const insertBody = {
    ...body,
    teacher_id: newUser.user.id,
    created_by: req.user?.id,
  };
  const { data, error } = await supabase
    .from("class_teachers")
    .insert([insertBody])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/class_teachers/{id}:
 *   get:
 *     summary: Get a class teacher by ID
 *     tags:
 *       - ClassTeachers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class teacher found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassTeacher'
 *       404:
 *         description: Class teacher not found
 *   put:
 *     summary: Update a class teacher by ID
 *     tags:
 *       - ClassTeachers
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
 *             $ref: '#/components/schemas/ClassTeacherInput'
 *     responses:
 *       200:
 *         description: Class teacher updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassTeacher'
 *       404:
 *         description: Class teacher not found
 *   delete:
 *     summary: Delete a class teacher by ID
 *     tags:
 *       - ClassTeachers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Class teacher deleted
 *       404:
 *         description: Class teacher not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("class_teachers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Class teacher not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const { data, error } = await supabase
    .from("class_teachers")
    .update({ ...body })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return res
      .status(404)
      .json({ error: "Class teacher not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("class_teachers").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete class teacher because it is still in use by other records.",
      });
    }
    return res.status(500).json({
      error: "An unexpected error occurred while deleting class teacher.",
    });
  }
  res.status(200).json({ message: "Class teacher deleted successfully" });
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     ClassTeacher:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         class_id:
 *           type: string
 *           format: uuid
 *         teacher_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [class_teacher, assistant_teacher, subject_teacher]
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *         assigned_at:
 *           type: string
 *           format: date-time
 *         unassigned_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ClassTeacherInput:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - role
 *         - status
 
 *       properties:
 *         class_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [class_teacher, assistant_teacher, subject_teacher]
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *         assigned_at:
 *           type: string
 *           format: date-time
 *         unassigned_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *           format: uuid
 */
