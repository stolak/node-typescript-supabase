/**
 * Routes for managing role to menu assignments.
 */
import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

/**
 * @openapi
 * /api/v1/role_menus:
 *   get:
 *     summary: Get all role-menu assignments
 *     tags:
 *       - RoleMenus
 *     responses:
 *       200:
 *         description: List of role-menu assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleMenu'
 *   post:
 *     summary: Assign a menu to a role
 *     tags:
 *       - RoleMenus
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_code
 *               - menu_id
 *             properties:
 *               role_code:
 *                 type: string
 *                 description: Role code to assign the menu to
 *               menu_id:
 *                 type: string
 *                 format: uuid
 *                 description: Menu ID to associate with the role
 *     responses:
 *       201:
 *         description: Role-menu assignment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleMenu'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Assignment already exists
 */
router
  .route("/")
  .get(async (_req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("role_menus")
      .select(
        `
        id,
        role_code,
        menu_id,
        role:roles(
          code,
          name,
          status
        ),
        menu:menus(
          id,
          route,
          caption
        )
      `
      )
      .order("role_code");

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  })
  .post(async (req: Request, res: Response) => {
    const { role_code, menu_id } = req.body ?? {};

    if (!role_code || !menu_id) {
      return res
        .status(400)
        .json({ error: "role_code and menu_id are required" });
    }

    const { data, error } = await supabase
      .from("role_menus")
      .insert([{ role_code, menu_id }])
      .select(
        `
        id,
        role_code,
        menu_id,
        role:roles(
          code,
          name,
          status
        ),
        menu:menus(
          id,
          route,
          caption
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Role already linked to menu" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  });

/**
 * @openapi
 * /api/v1/role_menus/bulk:
 *   post:
 *     summary: Assign multiple menus to a role
 *     tags:
 *       - RoleMenus
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_code
 *               - menu_ids
 *             properties:
 *               role_code:
 *                 type: string
 *                 description: Role code to assign menus to
 *               menu_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Distinct list of menu IDs to associate with the role
 *     responses:
 *       200:
 *         description: Role-menu assignments created or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleMenu'
 *       400:
 *         description: Missing or invalid request body
 */
router.post("/bulk", async (req: Request, res: Response) => {
  const { role_code, menu_ids } = req.body ?? {};

  if (!role_code || !Array.isArray(menu_ids) || menu_ids.length === 0) {
    return res.status(400).json({
      error: "role_code and a non-empty array of menu_ids are required",
    });
  }

  const uniqueMenuIds = [...new Set(menu_ids)].filter(
    (id) => typeof id === "string"
  );

  if (!uniqueMenuIds.length) {
    return res
      .status(400)
      .json({ error: "menu_ids must include valid strings" });
  }

  const records = uniqueMenuIds.map((menu_id: string) => ({
    role_code,
    menu_id,
  }));

  const { data, error } = await supabase
    .from("role_menus")
    .upsert(records, { onConflict: "role_code,menu_id" })
    .select(
      `
      id,
      role_code,
      menu_id,
      role:roles(
        code,
        name,
        status
      ),
      menu:menus(
        id,
        route,
        caption
      )
    `
    );

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

/**
 * @openapi
 * /api/v1/role_menus/role/{role_code}:
 *   get:
 *     summary: Get menus assigned to a role
 *     tags:
 *       - RoleMenus
 *     parameters:
 *       - in: path
 *         name: role_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Role code to filter assignments
 *     responses:
 *       200:
 *         description: List of menus mapped to the role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleMenu'
 *       404:
 *         description: No menus found for the specified role
 */
router.get("/role/:role_code", async (req: Request, res: Response) => {
  const { role_code } = req.params;

  const { data, error } = await supabase
    .from("role_menus")
    .select(
      `
      id,
      role_code,
      menu_id,
      role:roles(
        code,
        name,
        status
      ),
      menu:menus(
        id,
        route,
        caption
      )
    `
    )
    .eq("role_code", role_code)
    .order("menu(route)");

  if (error) return res.status(500).json({ error: error.message });

  if (!data || !data.length) {
    return res.status(404).json({ error: "No menus found for role" });
  }

  res.json(data);
});

/**
 * @openapi
 * /api/v1/role_menus/{id}:
 *   get:
 *     summary: Get a role-menu assignment by ID
 *     tags:
 *       - RoleMenus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assignment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleMenu'
 *       404:
 *         description: Assignment not found
 *   put:
 *     summary: Update a role-menu assignment by ID
 *     tags:
 *       - RoleMenus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_code:
 *                 type: string
 *               menu_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleMenu'
 *       404:
 *         description: Assignment not found
 *   delete:
 *     summary: Delete a role-menu assignment by ID
 *     tags:
 *       - RoleMenus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Assignment deleted
 *       404:
 *         description: Assignment not found
 */
router
  .route("/:id")
  .get(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("role_menus")
      .select(
        `
        id,
        role_code,
        menu_id,
        role:roles(
          code,
          name,
          status
        ),
        menu:menus(
          id,
          route,
          caption
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Assignment not found" });

    res.json(data);
  })
  .put(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role_code, menu_id } = req.body ?? {};

    const updateData: Record<string, unknown> = {};
    if (role_code !== undefined) updateData.role_code = role_code;
    if (menu_id !== undefined) updateData.menu_id = menu_id;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const { data, error } = await supabase
      .from("role_menus")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        id,
        role_code,
        menu_id,
        role:roles(
          code,
          name,
          status
        ),
        menu:menus(
          id,
          route,
          caption
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Role already linked to menu" });
      }
      return res
        .status(404)
        .json({ error: "Assignment not found or update failed" });
    }

    res.json(data);
  })
  .delete(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("role_menus")
      .delete()
      .eq("id", id)
      .select();

    if (error || !data?.length) {
      return res
        .status(404)
        .json({ error: "Assignment not found or delete failed" });
    }

    res.status(204).send();
  });

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     RoleMenu:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         role_code:
 *           type: string
 *         menu_id:
 *           type: string
 *           format: uuid
 *         role:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Role'
 *         menu:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Menu'
 */
