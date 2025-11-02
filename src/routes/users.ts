import { Router, Request, Response } from "express";
import { authorize, authenticateSupabaseToken } from "../middleware/auth";
import { supabase } from "../supabaseClient";
const router = Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase.auth.admin
    .listUsers()
    .then(({ data, error }) => ({ data: data?.users, error }));

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authorize(["user", "admin"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error || !data)
      return res.status(404).json({ error: "User not found" });
    res.json(data);
  }
);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *                 description: Full name of the user.
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["admin", "editor", "super-admin"]
 *                 description: Roles assigned to the user. Must be one or more of ["admin", "editor", "super-admin"].
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post(
  "/",
  authenticateSupabaseToken,
  authorize(["admin", "super-admin"]),
  async (req: Request, res: Response) => {
    const { email, password, phone, roles, name } = req.body;
    const allowedRoles = ["admin", "user", "super-admin"];
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return res.status(400).json({ error: "roles must be an array" });
      }
      const invalidRoles = roles.filter((r) => !allowedRoles.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `roles can only include: ${allowedRoles.join(", ")}`,
        });
      }
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      user_metadata: { roles, name },
      email_confirm: true,
    });
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data.user);
  }
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags:
 *       - Users
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
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *                 description: Full name of the user.
 *               phone:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["admin", "editor", "super-admin"]
 *                 description: Roles assigned to the user. Must be one or more of ["admin", "editor", "super-admin"].
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  authenticateSupabaseToken,
  authorize(["admin", "super-admin"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, phone, roles, name } = req.body;
    const allowedRoles = ["admin", "user", "super-admin"];
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return res.status(400).json({ error: "roles must be an array" });
      }
      const invalidRoles = roles.filter((r) => !allowedRoles.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `roles can only include: ${allowedRoles.join(", ")}`,
        });
      }
    }
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      email,
      phone,
      user_metadata: { roles, name },
    });
    if (error) return res.status(404).json({ error: error.message });
    res.json(data.user);
  }
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  authorize(["user", "admin"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return res.status(404).json({ error: error.message });
    res.status(204).send();
  }
);

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         user_metadata:
 *           type: object
 */

export default router;
