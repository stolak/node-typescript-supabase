import { Router, Request, Response } from "express";
import { authorize } from "../middleware/auth";
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: John Doe
 *                           email:
 *                             type: string
 *                             example: user@example.com
 *                           age:
 *                             type: integer
 *                             example: 30
 */
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: {
      users: [
        { name: "John Doe", email: "user@example.com", age: 30 },
        { name: "Jane Smith", email: "jane@example.com", age: 25 },
      ],
    },
  });
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
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         age:
 *                           type: integer
 *                           example: 30
 *
 */
router.get(
  "/:id",
  authorize(["user", "admin"]),
  (req: Request, res: Response) => {
    res.json({ message: `User details for ID ${req.params.id} (placeholder)` });
  }
);

export default router;
