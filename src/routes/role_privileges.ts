import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { generatePrivileges, UserPrivilege } from "../utils/routeMatcher";

const router = Router();

const DEFAULT_ROLES = [
  { code: "CLASS_TEACHER", name: "Class Teacher" },
  { code: "SUPER_ADMIN", name: "Super Admin" },
  { code: "ADMIN", name: "Admin" },
  { code: "STORE_KEEPER", name: "Store Keeper" },
];

async function seedDefaultRoles(): Promise<void> {
  const codes = DEFAULT_ROLES.map((role) => role.code);
  const { data, error } = await supabase
    .from("roles")
    .select("code")
    .in("code", codes);

  if (error) {
    console.error("Error fetching existing roles:", error);
    return;
  }

  const existingCodes = new Set(
    (data ?? []).map((item: { code: string }) => item.code)
  );
  const rolesToInsert = DEFAULT_ROLES.filter(
    (role) => !existingCodes.has(role.code)
  );

  if (!rolesToInsert.length) return;

  const { error: insertError } = await supabase
    .from("roles")
    .insert(rolesToInsert);
  if (insertError) {
    console.error("Error seeding default roles:", insertError);
  }
}

router.use(async (_req, _res, next) => {
  try {
    await seedDefaultRoles();
  } catch (error) {
    console.error("Error seeding roles middleware:", error);
  } finally {
    next();
  }
});

/**
 * @openapi
 * /api/v1/role_privileges:
 *   get:
 *     summary: Get all role privileges
 *     tags:
 *       - RolePrivileges
 *     parameters:
 *       - in: query
 *         name: role_code
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter privileges by role code
 *     responses:
 *       200:
 *         description: List of role privileges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolePrivilege'
 *   post:
 *     summary: Create a new role privilege
 *     tags:
 *       - RolePrivileges
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_code
 *               - description
 *             properties:
 *               role_code:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: Role privilege created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePrivilege'
 *       400:
 *         description: Missing required fields
 */
router.get("/", async (req: Request, res: Response) => {
  const { role_code } = req.query;
  let query = supabase.from("role_privileges").select("*");
  if (role_code) query = query.eq("role_code", role_code);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const mapData: UserPrivilege[] = data.map((val: UserPrivilege) => {
    return { description: val.description, status: val.status };
  });

  res.json({ role_code, privileges: generatePrivileges(mapData) });
});

router.post("/", async (req: Request, res: Response) => {
  const { role_code, description, status } = req.body;
  if (!role_code || !description) {
    return res
      .status(400)
      .json({ error: "role_code and description are required" });
  }

  const { data, error } = await supabase
    .from("role_privileges")
    .insert([{ role_code, description, status }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @openapi
 * /api/v1/role_privileges/upsert:
 *   post:
 *     summary: Upsert role privileges by role and description
 *     description: Insert or update role privileges based on the provided role and privilege definitions. Records are matched on the role and description combination.
 *     tags:
 *       - RolePrivileges
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - privileges
 *             properties:
 *               role:
 *                 type: string
 *               privileges:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - description
 *                       - status
 *                     properties:
 *                       description:
 *                         type: string
 *                       status:
 *                         oneOf:
 *                           - type: boolean
 *                           - type: string
 *                         description: Boolean or string status flag. Boolean true becomes "active", false becomes "inactive".
 *     responses:
 *       200:
 *         description: Role privileges upserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolePrivilege'
 *       400:
 *         description: Bad request - Invalid input
 */
router.post("/upsert", async (req: Request, res: Response) => {
  const { role, privileges } = req.body ?? {};

  if (!role || typeof role !== "string" || !privileges) {
    return res
      .status(400)
      .json({ error: "Body must include role and privileges" });
  }

  if (typeof privileges !== "object" || Array.isArray(privileges)) {
    return res
      .status(400)
      .json({ error: "privileges must be an object keyed by resource" });
  }

  const sanitizedRole = role.trim();

  const records = Object.values(privileges).flatMap((items) => {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && item.description)
      .map((item) => ({
        role_code: sanitizedRole,
        description: item.description,
        status:
          typeof item.status === "string"
            ? item.status
            : item.status === true
            ? "active"
            : "inactive",
      }));
  });

  if (!records.length) {
    return res.status(400).json({
      error: "No valid privileges provided",
    });
  }

  // Upsert using Supabase - match on role_code and description
  const { data, error } = await supabase
    .from("role_privileges")
    .upsert(records, {
      onConflict: "role_code,description",
    })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @openapi
 * /api/v1/role_privileges/{id}:
 *   get:
 *     summary: Get a role privilege by ID
 *     tags:
 *       - RolePrivileges
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role privilege found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePrivilege'
 *       404:
 *         description: Role privilege not found
 *   put:
 *     summary: Update a role privilege by ID
 *     tags:
 *       - RolePrivileges
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role privilege updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePrivilege'
 *       404:
 *         description: Role privilege not found
 *   delete:
 *     summary: Delete a role privilege by ID
 *     tags:
 *       - RolePrivileges
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Role privilege deleted
 *       404:
 *         description: Role privilege not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("role_privileges")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Role privilege not found" });
  res.json(data);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role_code, description, status } = req.body;

  const updateData: Record<string, any> = {};
  if (role_code !== undefined) updateData.role_code = role_code;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from("role_privileges")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return res
      .status(404)
      .json({ error: "Role privilege not found or update failed" });
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("role_privileges")
    .delete()
    .eq("id", id);

  if (error)
    return res
      .status(404)
      .json({ error: "Role privilege not found or delete failed" });

  res.status(204).send();
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     RolePrivilege:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         role_code:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
