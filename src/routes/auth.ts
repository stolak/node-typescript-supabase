import { Router, Request, Response } from "express";
import { authenticateSupabaseToken } from "../middleware/auth";

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
 *                   example: Token is valid!
 *                 user:
 *                   type: object
 *                   description: Decoded JWT payload
 *                   example:
 *                     name: "John Doe"
 *                     email: "user@example.com"
 *       401:
 *         description: Invalid token
 */
router.get(
  "/test",
  authenticateSupabaseToken,
  (req: Request, res: Response) => {
    res.json({
      message: "Token is valid!",
      user: req.user,
    });
  }
);

/**
 * @openapi
 * /api/v1/protected:
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
 *                   example: You are authenticated with Supabase!
 *                 user:
 *                   type: object
 *                   description: Decoded JWT payload
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
router.get(
  "/protected",
  authenticateSupabaseToken,
  (req: Request, res: Response) => {
    res.json({
      message: "You are authenticated with Supabase!",
      user: req.user,
    });
  }
);

export default router;
