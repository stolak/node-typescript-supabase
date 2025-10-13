import { Router, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService";

const router = Router();

/**
 * @openapi
 * /api/v1/inventory_summary/{inventoryId}:
 *   get:
 *     summary: Get inventory summary by inventory ID
 *     tags:
 *       - InventorySummary
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the inventory item
 *     responses:
 *       200:
 *         description: Inventory summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventorySummary'
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.get("/:inventoryId", async (req: Request, res: Response) => {
  try {
    const { inventoryId } = req.params;

    if (!inventoryId) {
      return res.status(400).json({ error: "Inventory ID is required" });
    }

    const summary = await inventoryService.getInventorySummary(inventoryId);

    if (!summary) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(summary);
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/inventory_summary/bulk:
 *   post:
 *     summary: Get inventory summaries for multiple items
 *     tags:
 *       - InventorySummary
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventory_ids
 *             properties:
 *               inventory_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of inventory item UUIDs
 *     responses:
 *       200:
 *         description: Bulk inventory summaries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventorySummary'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/bulk", async (req: Request, res: Response) => {
  try {
    const { inventory_ids } = req.body;

    if (!Array.isArray(inventory_ids) || inventory_ids.length === 0) {
      return res.status(400).json({
        error: "inventory_ids must be a non-empty array",
      });
    }

    const summaries = await inventoryService.getBulkInventorySummary(
      inventory_ids
    );
    res.json(summaries);
  } catch (error) {
    console.error("Error fetching bulk inventory summaries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /api/v1/inventory_summary/{inventoryId}/transactions/{transactionType}:
 *   get:
 *     summary: Get transaction summary by type for an inventory item
 *     tags:
 *       - InventorySummary
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the inventory item
 *       - in: path
 *         name: transactionType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [purchase, sale]
 *         description: The type of transaction
 *     responses:
 *       200:
 *         description: Transaction summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryTransactionSummary'
 *       404:
 *         description: Inventory item or transactions not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:inventoryId/transactions/:transactionType",
  async (req: Request, res: Response) => {
    try {
      const { inventoryId, transactionType } = req.params;

      if (!inventoryId) {
        return res.status(400).json({ error: "Inventory ID is required" });
      }

      if (!["purchase", "sale"].includes(transactionType)) {
        return res.status(400).json({
          error: "Transaction type must be 'purchase' or 'sale'",
        });
      }

      const summary = await inventoryService.getTransactionSummaryByType(
        inventoryId,
        transactionType as "purchase" | "sale"
      );

      if (!summary) {
        return res.status(404).json({
          error: "No transactions found for this inventory item and type",
        });
      }

      res.json(summary);
    } catch (error) {
      console.error("Error fetching transaction summary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @openapi
 * /api/v1/inventory_summary/low-stock:
 *   get:
 *     summary: Get all low stock inventory items
 *     tags:
 *       - InventorySummary
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventorySummary'
 *       500:
 *         description: Internal server error
 */
router.get("/low-stock", async (req: Request, res: Response) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    res.json(lowStockItems);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     InventorySummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         sku:
 *           type: string
 *         current_stock:
 *           type: integer
 *         total_in_quantity:
 *           type: integer
 *         total_out_quantity:
 *           type: integer
 *         total_in_cost:
 *           type: number
 *         total_out_cost:
 *           type: number
 *         low_stock_threshold:
 *           type: integer
 *         is_low_stock:
 *           type: boolean
 *         category_name:
 *           type: string
 *         brand_name:
 *           type: string
 *         uom_name:
 *           type: string
 *         last_transaction_date:
 *           type: string
 *           format: date-time
 *         last_purchase_date:
 *           type: string
 *           format: date-time
 *         last_sale_date:
 *           type: string
 *           format: date-time
 *     InventoryTransactionSummary:
 *       type: object
 *       properties:
 *         transaction_type:
 *           type: string
 *           enum: [purchase, sale]
 *         total_quantity:
 *           type: integer
 *         total_cost:
 *           type: number
 *         transaction_count:
 *           type: integer
 *         last_transaction_date:
 *           type: string
 *           format: date-time
 */
