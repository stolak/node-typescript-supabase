import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { authenticateSupabaseToken, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticateSupabaseToken);
router.use(authorize(["admin", "super-admin"]));

/**
 * @openapi
 * /api/v1/user_roles:
 *   get:
 *     summary: List user-role assignments
 *     tags:
 *       - UserRoles
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Filter assignments by Supabase user ID
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter assignments by role code
 *     responses:
 *       200:
 *         description: List of user-role assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRole'
 *   post:
 *     summary: Assign a role to a user
 *     tags:
 *       - UserRoles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - role_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Supabase auth user ID
 *               role_id:
 *                 type: string
 *                 description: Role code to assign
 *     responses:
 *       201:
 *         description: Role assigned to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserRole'
 *       400:
 *         description: Missing or invalid request body
 *       409:
 *         description: Assignment already exists
 */
router
  .route("/")
  .get(async (req: Request, res: Response) => {
    const { user_id, role_id } = req.query;

    let query = supabase.from("user_roles").select(
      `
        user_id,
        role_id,
        role:roles(
          code,
          name,
          status,
          privileges:role_privileges(
            id,
            description,
            status,
            created_at,
            updated_at
          )
        )
      `
    );

    if (user_id) {
      query = query.eq("user_id", String(user_id));
    }
    if (role_id) {
      query = query.eq("role_id", String(role_id));
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  })
  .post(async (req: Request, res: Response) => {
    const { user_id, role_id } = req.body ?? {};

    if (!user_id || !role_id) {
      return res
        .status(400)
        .json({ error: "user_id and role_id are required" });
    }

    const { data, error } = await supabase
      .from("user_roles")
      .insert([{ user_id, role_id }])
      .select(
        `
        user_id,
        role_id,
        role:roles(
          code,
          name,
          status,
          privileges:role_privileges(
            id,
            description,
            status,
            created_at,
            updated_at
          )
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: "User already has this role",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  });

/**
 * @openapi
 * /api/v1/user_roles/{user_id}:
 *   get:
 *     summary: Get roles assigned to a user
 *     tags:
 *       - UserRoles
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Roles assigned to the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRole'
 *       404:
 *         description: No roles found for the specified user
 */
router.get("/:user_id", async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `
      user_id,
      role_id,
      role:roles(
        code,
        name,
        status,
        privileges:role_privileges(
          id,
          description,
          status,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("user_id", user_id);

  if (error) return res.status(500).json({ error: error.message });

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "No roles found for user" });
  }

  res.json(data);
});

/**
 * @openapi
 * /api/v1/user_roles/{user_id}/{role_id}:
 *   delete:
 *     summary: Remove a role assignment from a user
 *     tags:
 *       - UserRoles
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Role removed from user
 *       404:
 *         description: Assignment not found
 */
router.delete("/:user_id/:role_id", async (req: Request, res: Response) => {
  const { user_id, role_id } = req.params;

  const { data, error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user_id)
    .eq("role_id", role_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Assignment not found" });
  }

  res.status(204).send();
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     UserRole:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         role_id:
 *           type: string
 *         role:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Role'
 */
