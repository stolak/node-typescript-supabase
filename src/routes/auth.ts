import { Router, Request, Response } from "express";
import { authenticateSupabaseToken, getUser } from "../middleware/auth";

const router = Router();

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
