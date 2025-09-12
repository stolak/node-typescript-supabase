/**
 * @openapi
 * /auth/test:
 *   get:
 *     summary: Test authentication endpoint
 *     description: A simple endpoint to test if your token is working
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
 *                   example: "Token is valid!"
 *                 user:
 *                   type: object
 *                   description: Decoded JWT payload
 *       401:
 *         description: Invalid token
 */

/**
 * @openapi
 * /protected:
 *   get:
 *     summary: Protected endpoint requiring Supabase authentication
 *     description: This endpoint requires a valid Supabase JWT token in the Authorization header
 *     security:
 *       - bearerAuth: []
 *
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
 *                   example: "You are authenticated with Supabase!"
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
 *                   example: "No token provided"
 */

/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint
 *     responses:
 *       200:
 *         description: Welcome message
 */
