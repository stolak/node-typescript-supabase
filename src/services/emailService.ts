import nodemailer, { Transporter } from "nodemailer";

export interface EmailConfig {
  driver: string;
  host: string;
  port: number;
  username: string;
  fromAddress: string;
  password: string;
  encryption: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface NotificationData {
  recipientName: string;
  recipientEmail: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  footerText?: string;
}

export class EmailService {
  private transporter!: Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      driver: process.env.MAIL_DRIVER || "smtp",
      host: process.env.MAIL_HOST || "mail.mbrcomputers.net",
      port: parseInt(process.env.MAIL_PORT || "465"),
      username: process.env.MAIL_USERNAME || "test@mbrcomputers.com",
      fromAddress: process.env.MAIL_FROM_ADDRESS || "test@mbrcomputers.com",
      password: process.env.MAIL_PASSWORD || "RealPassword",
      encryption: process.env.MAIL_ENCRYPTION || "ssl",
    };

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.encryption === "ssl", // true for 465, false for other ports
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
      tls: {
        rejectUnauthorized: false, // For development/testing purposes
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Email service configuration error:", error);
      } else {
        console.log("Email service is ready to send messages");
      }
    });
  }

  /**
   * Send email using nodemailer
   * @param options - Email options
   * @returns Promise<boolean>
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.fromAddress,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(", ")
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc
          : undefined,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send notification email with template
   * @param data - Notification data
   * @returns Promise<boolean>
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    const html = this.generateNotificationTemplate(data);

    return await this.sendEmail({
      to: data.recipientEmail,
      subject: data.title,
      html: html,
    });
  }

  /**
   * Send low stock alert email
   * @param recipientEmail - Recipient email address
   * @param itemName - Name of the low stock item
   * @param currentStock - Current stock level
   * @param threshold - Low stock threshold
   * @returns Promise<boolean>
   */
  async sendLowStockAlert(
    recipientEmail: string,
    itemName: string,
    currentStock: number,
    threshold: number
  ): Promise<boolean> {
    const data: NotificationData = {
      recipientName: "Inventory Manager",
      recipientEmail: recipientEmail,
      title: "Low Stock Alert",
      message: `The inventory item "${itemName}" is running low on stock. Current stock: ${currentStock}, Threshold: ${threshold}`,
      actionUrl: "/inventory",
      actionText: "View Inventory",
      companyName: "MBR Computers",
      footerText:
        "This is an automated alert from the inventory management system.",
    };

    return await this.sendNotification(data);
  }

  /**
   * Send welcome email to new users
   * @param recipientEmail - Recipient email address
   * @param recipientName - Recipient name
   * @param loginUrl - Login URL
   * @returns Promise<boolean>
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    loginUrl: string
  ): Promise<boolean> {
    const data: NotificationData = {
      recipientName: recipientName,
      recipientEmail: recipientEmail,
      title: "Welcome to MBR Computers Inventory System",
      message:
        "Your account has been created successfully. You can now access the inventory management system.",
      actionUrl: loginUrl,
      actionText: "Login to System",
      companyName: "MBR Computers",
      footerText: "If you have any questions, please contact our support team.",
    };

    return await this.sendNotification(data);
  }

  /**
   * Send password reset email
   * @param recipientEmail - Recipient email address
   * @param recipientName - Recipient name
   * @param resetUrl - Password reset URL
   * @returns Promise<boolean>
   */
  async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetUrl: string
  ): Promise<boolean> {
    const data: NotificationData = {
      recipientName: recipientName,
      recipientEmail: recipientEmail,
      title: "Password Reset Request",
      message:
        "You have requested to reset your password. Click the link below to reset your password.",
      actionUrl: resetUrl,
      actionText: "Reset Password",
      companyName: "MBR Computers",
      footerText:
        "This link will expire in 24 hours. If you did not request this, please ignore this email.",
    };

    return await this.sendNotification(data);
  }

  /**
   * Generate HTML email template for notifications
   * @param data - Notification data
   * @returns string - HTML template
   */
  private generateNotificationTemplate(data: NotificationData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
            color: #34495e;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .action-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .company-info {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .footer-text {
            margin-top: 10px;
            font-style: italic;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>${data.title}</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${data.recipientName},
            </div>
            
            <div class="message">
                ${data.message}
            </div>
            
            ${
              data.actionUrl
                ? `
                <div style="text-align: center;">
                    <a href="${data.actionUrl}" class="action-button">
                        ${data.actionText || "Take Action"}
                    </a>
                </div>
            `
                : ""
            }
        </div>
        
        <div class="footer">
            <div class="company-info">
                ${data.companyName || "MBR Computers"}
            </div>
            <div>
                This email was sent from our inventory management system.
            </div>
            ${
              data.footerText
                ? `
                <div class="footer-text">
                    ${data.footerText}
                </div>
            `
                : ""
            }
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send bulk emails
   * @param options - Email options with multiple recipients
   * @returns Promise<{success: number, failed: number}>
   */
  async sendBulkEmails(
    options: EmailOptions
  ): Promise<{ success: number; failed: number }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        ...options,
        to: recipient,
      });

      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Test email configuration
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connection test successful");
      return true;
    } catch (error) {
      console.error("Email service connection test failed:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService();
