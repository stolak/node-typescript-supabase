import { Router, Request, Response } from "express";
import { emailService } from "../services/emailService";
import { EmailTemplates } from "../services/emailTemplates";

const router = Router();

/**
 * @openapi
 * /api/v1/notifications/test-email:
 *   post:
 *     summary: Send test email
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/test-email", async (req: Request, res: Response) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        error: "to, subject, and message are required",
      });
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>${message}</p>
          <p style="color: #666; font-size: 14px;">
            This is a test email from the MBR Computers inventory system.
          </p>
        </div>
      `,
    });

    if (success) {
      res.json({ message: "Test email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/low-stock-alert:
 *   post:
 *     summary: Send low stock alert email
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - itemName
 *               - currentStock
 *               - threshold
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               itemName:
 *                 type: string
 *               currentStock:
 *                 type: integer
 *               threshold:
 *                 type: integer
 *               category:
 *                 type: string
 *               lastPurchaseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Low stock alert sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/low-stock-alert", async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      itemName,
      currentStock,
      threshold,
      category,
      lastPurchaseDate,
    } = req.body;

    if (
      !recipientEmail ||
      !itemName ||
      currentStock === undefined ||
      threshold === undefined
    ) {
      return res.status(400).json({
        error:
          "recipientEmail, itemName, currentStock, and threshold are required",
      });
    }

    const template = EmailTemplates.lowStockAlert({
      itemName,
      currentStock,
      threshold,
      category,
      lastPurchaseDate,
    });

    const success = await emailService.sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (success) {
      res.json({ message: "Low stock alert sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send low stock alert" });
    }
  } catch (error) {
    console.error("Error sending low stock alert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/welcome-email:
 *   post:
 *     summary: Send welcome email to new user
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - userName
 *               - loginUrl
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               userName:
 *                 type: string
 *               loginUrl:
 *                 type: string
 *               systemName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Welcome email sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/welcome-email", async (req: Request, res: Response) => {
  try {
    const { recipientEmail, userName, loginUrl, systemName } = req.body;

    if (!recipientEmail || !userName || !loginUrl) {
      return res.status(400).json({
        error: "recipientEmail, userName, and loginUrl are required",
      });
    }

    const template = EmailTemplates.welcomeEmail({
      userName,
      loginUrl,
      systemName,
    });

    const success = await emailService.sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (success) {
      res.json({ message: "Welcome email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/password-reset:
 *   post:
 *     summary: Send password reset email
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - userName
 *               - resetUrl
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               userName:
 *                 type: string
 *               resetUrl:
 *                 type: string
 *               expiryHours:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/password-reset", async (req: Request, res: Response) => {
  try {
    const { recipientEmail, userName, resetUrl, expiryHours } = req.body;

    if (!recipientEmail || !userName || !resetUrl) {
      return res.status(400).json({
        error: "recipientEmail, userName, and resetUrl are required",
      });
    }

    const template = EmailTemplates.passwordReset({
      userName,
      resetUrl,
      expiryHours,
    });

    const success = await emailService.sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (success) {
      res.json({ message: "Password reset email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/daily-summary:
 *   post:
 *     summary: Send daily inventory summary email
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - totalItems
 *               - lowStockItems
 *               - totalTransactions
 *               - totalValue
 *               - date
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               totalItems:
 *                 type: integer
 *               lowStockItems:
 *                 type: integer
 *               totalTransactions:
 *                 type: integer
 *               totalValue:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Daily summary email sent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/daily-summary", async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      totalItems,
      lowStockItems,
      totalTransactions,
      totalValue,
      date,
    } = req.body;

    if (
      !recipientEmail ||
      totalItems === undefined ||
      lowStockItems === undefined ||
      totalTransactions === undefined ||
      totalValue === undefined ||
      !date
    ) {
      return res.status(400).json({
        error:
          "recipientEmail, totalItems, lowStockItems, totalTransactions, totalValue, and date are required",
      });
    }

    const template = EmailTemplates.dailyInventorySummary({
      totalItems,
      lowStockItems,
      totalTransactions,
      totalValue,
      date,
    });

    const success = await emailService.sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (success) {
      res.json({ message: "Daily summary email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send daily summary email" });
    }
  } catch (error) {
    console.error("Error sending daily summary email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/test-connection:
 *   get:
 *     summary: Test email service connection
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Connection test result
 *       500:
 *         description: Internal server error
 */
router.get("/test-connection", async (req: Request, res: Response) => {
  try {
    const isConnected = await emailService.testConnection();

    if (isConnected) {
      res.json({
        message: "Email service connection successful",
        status: "connected",
      });
    } else {
      res.status(500).json({
        error: "Email service connection failed",
        status: "disconnected",
      });
    }
  } catch (error) {
    console.error("Error testing email connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/notifications/config-status:
 *   get:
 *     summary: Get email service configuration status
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Configuration status retrieved successfully
 */
router.get("/config-status", async (req: Request, res: Response) => {
  try {
    const status = emailService.getConfigurationStatus();
    res.json(status);
  } catch (error) {
    console.error("Error getting email configuration status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
