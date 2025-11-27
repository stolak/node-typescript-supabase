import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { createUser } from "../services/userService";

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
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               class_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional class ID to assign the teacher to
 *                 example: "f0639527-fec7-49bf-996a-c779b066e9a7"
 *               name:
 *                 type: string
 *                 description: Teacher's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Teacher's email address (must be unique)
 *                 example: "example@example.com"
 *               role:
 *                 type: string
 *                 description: Teacher role (defaults to CLASS_TEACHER if not provided)
 *                 enum: [CLASS_TEACHER, ASSISTANT_TEACHER, SUBJECT_TEACHER]
 *                 default: CLASS_TEACHER
 *                 example: "CLASS_TEACHER"
 *               status:
 *                 type: string
 *                 description: Teacher status (defaults to active if not provided)
 *                 enum: [active, inactive, archived]
 *                 default: active
 *                 example: "active"
 *           example:
 *             class_id: "f0639527-fec7-49bf-996a-c779b066e9a7"
 *             name: "John Doe"
 *             email: "example@example.com"
 *             role: "CLASS_TEACHER"
 *             status: "active"
 *     responses:
 *       201:
 *         description: Class teacher created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassTeacher'
 *       400:
 *         description: Bad request - missing required fields or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "email and name are required"
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
  const { data, error: createUserError } = await createUser({
    email: body.email,
    password: body.password || "123456",
    name: body.name,
    role_code: body.role || "CLASS_TEACHER",
  });
  if (createUserError) {
    return res.status(500).json({ error: createUserError });
  }
  // Insert class_teacher
  delete body.password;
  delete body.role;

  const insertBody = {
    class_id: body.class_id,
    name: body.name,
    email: body.email,
    teacher_id: data.id,
    created_by: req.user?.id,
  };
  console.log(insertBody);
  const { data: classTeacherData, error: classTeacherInsertError } =
    await supabase
      .from("class_teachers")
      .insert([insertBody])
      .select()
      .single();
  if (classTeacherInsertError)
    return res.status(500).json({ error: classTeacherInsertError });
  res.status(201).json(classTeacherData);
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
 *           enum: [CLASS_TEACHER, ASSISTANT_TEACHER, SUBJECT_TEACHER]
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
 *       properties:
 *         class_id:
 *           type: string
 *           format: uuid
 *           description: Optional class ID to assign the teacher to
 *           example: "f0639527-fec7-49bf-996a-c779b066e9a7"
 *         name:
 *           type: string
 *           description: Teacher's full name
 *           example: "dfdfdfee"
 *         email:
 *           type: string
 *           format: email
 *           description: Teacher's email address (must be unique)
 *           example: "string@hhreeh.comerrggr"
 *         role:
 *           type: string
 *           description: Teacher role (defaults to CLASS_TEACHER if not provided)
 *           enum: [CLASS_TEACHER, ASSISTANT_TEACHER, SUBJECT_TEACHER]
 *           default: CLASS_TEACHER
 *           example: "CLASS_TEACHER"
 *         status:
 *           type: string
 *           description: Teacher status (defaults to active if not provided)
 *           enum: [active, inactive, archived]
 *           default: active
 *           example: "active"
 *         password:
 *           type: string
 *           description: Optional password for the user account (defaults to "123456" if not provided)
 *           writeOnly: true
 */
