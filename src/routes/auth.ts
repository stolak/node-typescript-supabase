import { Router, Request, Response } from "express";
import { authenticateSupabaseToken, getUser } from "../middleware/auth";
import fetch from "node-fetch";

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
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await response.json();
    console.log(data);
    if (!response.ok) {
      return res
        .status(401)
        .json({ error: data.error || "Invalid credentials" });
    }
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
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

export default router;
