import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { authenticateSupabaseToken, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticateSupabaseToken);
// router.use(authorize(["admin", "super-admin"]));

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
 *         name: role_code
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
 *     summary: Assign a role to a user (upsert)
 *     description: Creates or updates the user-role assignment. If the assignment already exists, it will be updated.
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
 *               - role_code
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Supabase auth user ID
 *               role_code:
 *                 type: string
 *                 description: Role code to assign
 *     responses:
 *       200:
 *         description: Role assigned or updated for user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserRole'
 *       400:
 *         description: Missing or invalid request body
 */
router
  .route("/")
  .get(async (req: Request, res: Response) => {
    const { user_id, role_code } = req.query;

    let query = supabase.from("user_roles").select(
      `
        user_id,
        role_code,
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
          ),
          menus:role_menus(
            id,
            menu_id,
            menu:menus(
              id,
              route,
              caption
            )
          )
         
        )
      `
    );

    if (user_id) {
      query = query.eq("user_id", String(user_id));
    }
    if (role_code) {
      query = query.eq("role_code", String(role_code));
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  })
  .post(async (req: Request, res: Response) => {
    const { user_id, role_code } = req.body ?? {};

    if (!user_id || !role_code) {
      return res
        .status(400)
        .json({ error: "user_id and role_code are required" });
    }

    const { data, error } = await supabase
      .from("user_roles")
      .upsert([{ user_id, role_code }], {
        onConflict: "user_id",
      })
      .select(
        `
        user_id,
        role_code,
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
    await supabase.auth.admin.updateUserById(user_id, {
      app_metadata: { roles: [role_code] },
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
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
      role_code,
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
 * /api/v1/user_roles/{user_id}/{role_code}:
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
 *         name: role_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Role removed from user
 *       404:
 *         description: Assignment not found
 */
router.delete("/:user_id/:role_code", async (req: Request, res: Response) => {
  const { user_id, role_code } = req.params;

  const { data, error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user_id)
    .eq("role_code", role_code)
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
 *         role_code:
 *           type: string
 *         role:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Role'
 */
