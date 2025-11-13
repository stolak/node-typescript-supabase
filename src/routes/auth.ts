import { Router, Request, Response } from "express";
import { authenticateSupabaseToken, getUser } from "../middleware/auth";
import fetch from "node-fetch";
import { supabase } from "../supabaseClient";
import {
  getUserRolesAndPermissions,
  createUser,
} from "../services/userService";

const router = Router();
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: User login with email and password
 *     tags:
 *       - Auth
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
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          // Optional: Set custom expiration (in seconds)
          // expires_in: 3600 * 24 // 24 hours
        }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      return res
        .status(401)
        .json({ error: data.error || "Invalid credentials" });
    }

    const id = data.user.id;
    const { data: rolesData, error: rolesError } =
      await getUserRolesAndPermissions(id);
    if (rolesError) {
      return res.status(500).json({ error: rolesError });
    }
    const menus = rolesData?.menus || [];
    const privileges = rolesData?.privileges || [];

    const { data: teacherData, error: teacherError } = await supabase
      .from("class_teachers")
      .select("*")
      .eq("teacher_id", id)
      .single();
    if (teacherError) {
      return res.json({
        ...data,
        teacher_id: null,
        menus,
      });
    }
    res.json({
      ...data,
      teacher_id: teacherData?.id,
      menus,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token,
          // Optional: Set custom expiration for new token
          // expires_in: 3600 * 24 // 24 hours
        }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      return res
        .status(401)
        .json({ error: data.error || "Invalid refresh token" });
    }

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

/**
 * @openapi
 * /api/v1/auth/test:
 *   get:
 *     summary: Test authentication endpoint
 *     description: A simple endpoint to test if your token is working
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token validate from supabase!
 *                 user:
 *                   type: object
 *                   description: Decoded JWT payload
 *                   example:
 *                     id: f6e05715-0dcb-4d22-8712-9e617c966464
 *                     name: admin@admin.com
 *                     email: admin@admin.com
 *                     roles:
 *                       - admin
 *                       - editor
 *                       - super-admin
 *       401:
 *         description: Invalid token
 */
router.get(
  "/test",
  authenticateSupabaseToken,
  (req: Request, res: Response) => {
    res.json({
      message: "Token validate from supabase!",
      user: req.user,
    });
  }
);

/**
 * @openapi
 * /api/v1/auth/protected:
 *   get:
 *     summary: Protected endpoint requiring Supabase authentication
 *     description: This endpoint requires a valid Supabase JWT token in the Authorization header
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token is valid!
 *                 user:
 *                   type: object
 *                   description: Decoded JWT payload
 *                   example:
 *                     id: f6e05715-0dcb-4d22-8712-9e617c966464
 *                     name: admin@admin.com
 *                     email: admin@admin.com
 *                     roles:
 *                       - admin
 *                       - editor
 *                       - super-admin
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No token provided
 */
router.get("/protected", getUser, (req: Request, res: Response) => {
  res.json({
    message: "Valid token",
    user: req.user,
  });
});

/**
 * @openapi
 * /api/v1/auth/users:
 *   get:
 *     summary: Get all Supabase auth users
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to retrieve users
 */
router.get(
  "/users",
  authenticateSupabaseToken,
  async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(data?.users ?? []);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  }
);

/**
 * @openapi
 * /api/v1/auth/create-user:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Optional password (defaults to "123456" if not provided)
 *               name:
 *                 type: string
 *                 description: Optional user name
 *               role_code:
 *                 type: string
 *                 description: Optional role code
 *               email_confirm:
 *                 type: boolean
 *                 description: Whether to auto-confirm email (defaults to true)
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Failed to create user
 */
router.post(
  "/create-user",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    const { email, password, name, role_code, email_confirm } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const { data, error: createError } = await createUser({
        email,
        password,
        name,
        role_code,
        email_confirm,
      });

      if (createError) {
        return res.status(500).json({ error: createError });
      }

      res.status(201).json({
        message: "User created successfully",
        user: data,
      });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Failed to create user",
      });
    }
  }
);
export default router;
