/**
 * Email Templates for various notifications
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailTemplates {
  /**
   * Inventory Low Stock Alert Template
   */
  static lowStockAlert(data: {
    itemName: string;
    currentStock: number;
    threshold: number;
    category?: string;
    lastPurchaseDate?: string;
  }): EmailTemplate {
    return {
      subject: `Low Stock Alert: ${data.itemName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">🚨 Low Stock Alert</h2>
          
          <p><strong>Item:</strong> ${data.itemName}</p>
          <p><strong>Current Stock:</strong> ${data.currentStock}</p>
          <p><strong>Threshold:</strong> ${data.threshold}</p>
          ${
            data.category
              ? `<p><strong>Category:</strong> ${data.category}</p>`
              : ""
          }
          ${
            data.lastPurchaseDate
              ? `<p><strong>Last Purchase:</strong> ${data.lastPurchaseDate}</p>`
              : ""
          }
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #856404;">
              <strong>Action Required:</strong> Please consider reordering this item to maintain adequate stock levels.
            </p>
          </div>
        </div>
      `,
      text: `Low Stock Alert: ${data.itemName}\n\nCurrent Stock: ${data.currentStock}\nThreshold: ${data.threshold}\n\nAction Required: Please consider reordering this item.`,
    };
  }

  /**
   * Welcome Email Template
   */
  static welcomeEmail(data: {
    userName: string;
    loginUrl: string;
    systemName?: string;
  }): EmailTemplate {
    return {
      subject: `Welcome to ${
        data.systemName || "MBR Computers Inventory System"
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">🎉 Welcome, ${data.userName}!</h2>
          
          <p>Your account has been successfully created and you now have access to our inventory management system.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #155724;">
              <strong>Getting Started:</strong> Click the button below to access your account and start managing inventory.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Access System
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
      `,
      text: `Welcome, ${data.userName}!\n\nYour account has been created successfully. Access the system at: ${data.loginUrl}`,
    };
  }

  /**
   * Password Reset Template
   */
  static passwordReset(data: {
    userName: string;
    resetUrl: string;
    expiryHours?: number;
  }): EmailTemplate {
    return {
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">🔒 Password Reset Request</h2>
          
          <p>Hello ${data.userName},</p>
          
          <p>We received a request to reset your password for your account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              data.resetUrl
            }" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #721c24;">
              <strong>Important:</strong> This link will expire in ${
                data.expiryHours || 24
              } hours for security reasons.
            </p>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you did not request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `,
      text: `Password Reset Request\n\nHello ${
        data.userName
      },\n\nReset your password using this link: ${
        data.resetUrl
      }\n\nThis link expires in ${data.expiryHours || 24} hours.`,
    };
  }

  /**
   * Inventory Transaction Notification Template
   */
  static transactionNotification(data: {
    transactionType: "purchase" | "sale";
    itemName: string;
    quantity: number;
    amount?: number;
    transactionDate: string;
    performedBy?: string;
  }): EmailTemplate {
    const isPurchase = data.transactionType === "purchase";
    const emoji = isPurchase ? "📦" : "💰";
    const color = isPurchase ? "#27ae60" : "#e74c3c";

    return {
      subject: `${emoji} Inventory ${
        isPurchase ? "Purchase" : "Sale"
      } Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${color};">${emoji} Inventory ${
        isPurchase ? "Purchase" : "Sale"
      }</h2>
          
          <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Item:</strong> ${data.itemName}</p>
            <p><strong>Type:</strong> ${isPurchase ? "Purchase" : "Sale"}</p>
            <p><strong>Quantity:</strong> ${data.quantity}</p>
            ${
              data.amount
                ? `<p><strong>Amount:</strong> $${data.amount}</p>`
                : ""
            }
            <p><strong>Date:</strong> ${data.transactionDate}</p>
            ${
              data.performedBy
                ? `<p><strong>Performed By:</strong> ${data.performedBy}</p>`
                : ""
            }
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            This is an automated notification from the inventory management system.
          </p>
        </div>
      `,
      text: `Inventory ${isPurchase ? "Purchase" : "Sale"}\n\nItem: ${
        data.itemName
      }\nQuantity: ${data.quantity}\nDate: ${data.transactionDate}`,
    };
  }

  /**
   * System Maintenance Notification Template
   */
  static maintenanceNotification(data: {
    startTime: string;
    endTime: string;
    description?: string;
    affectedServices?: string[];
  }): EmailTemplate {
    return {
      subject: "Scheduled System Maintenance",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f39c12;">🔧 Scheduled System Maintenance</h2>
          
          <p>We will be performing scheduled maintenance on our inventory management system.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Maintenance Window:</strong></p>
            <p><strong>Start:</strong> ${data.startTime}</p>
            <p><strong>End:</strong> ${data.endTime}</p>
            ${
              data.description
                ? `<p><strong>Description:</strong> ${data.description}</p>`
                : ""
            }
          </div>
          
          ${
            data.affectedServices && data.affectedServices.length > 0
              ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24;">
                <strong>Affected Services:</strong> ${data.affectedServices.join(
                  ", "
                )}
              </p>
            </div>
          `
              : ""
          }
          
          <p style="color: #6c757d; font-size: 14px;">
            We apologize for any inconvenience this may cause. We will notify you once maintenance is complete.
          </p>
        </div>
      `,
      text: `Scheduled System Maintenance\n\nStart: ${data.startTime}\nEnd: ${data.endTime}\n\nWe apologize for any inconvenience.`,
    };
  }

  /**
   * Daily Inventory Summary Template
   */
  static dailyInventorySummary(data: {
    totalItems: number;
    lowStockItems: number;
    totalTransactions: number;
    totalValue: number;
    date: string;
  }): EmailTemplate {
    return {
      subject: `Daily Inventory Summary - ${data.date}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">📊 Daily Inventory Summary</h2>
          
          <p><strong>Date:</strong> ${data.date}</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="margin: 0; color: #27ae60;">${data.totalItems}</h3>
              <p style="margin: 5px 0 0 0; color: #2c3e50;">Total Items</p>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="margin: 0; color: #f39c12;">${data.lowStockItems}</h3>
              <p style="margin: 5px 0 0 0; color: #2c3e50;">Low Stock Items</p>
            </div>
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="margin: 0; color: #2196f3;">${
                data.totalTransactions
              }</h3>
              <p style="margin: 5px 0 0 0; color: #2c3e50;">Transactions</p>
            </div>
            <div style="background-color: #f3e5f5; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="margin: 0; color: #9c27b0;">$${data.totalValue}</h3>
              <p style="margin: 5px 0 0 0; color: #2c3e50;">Total Value</p>
            </div>
          </div>
          
          ${
            data.lowStockItems > 0
              ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24;">
                <strong>⚠️ Alert:</strong> ${data.lowStockItems} item(s) are running low on stock and may need reordering.
              </p>
            </div>
          `
              : ""
          }
          
          <p style="color: #6c757d; font-size: 14px;">
            This is your daily inventory summary. For detailed reports, please log into the system.
          </p>
        </div>
      `,
      text: `Daily Inventory Summary - ${data.date}\n\nTotal Items: ${data.totalItems}\nLow Stock Items: ${data.lowStockItems}\nTransactions: ${data.totalTransactions}\nTotal Value: $${data.totalValue}`,
    };
  }
}
