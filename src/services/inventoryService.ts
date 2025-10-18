import { supabase } from "../supabaseClient";

export interface InventorySummary {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
  total_in_quantity: number;
  total_out_quantity: number;
  total_in_cost: number;
  total_out_cost: number;
  low_stock_threshold?: number;
  is_low_stock: boolean;
  category_name?: string;
  sub_category_name?: string;
  brand_name?: string;
  uom_name?: string;
  last_transaction_date?: string;
  last_purchase_date?: string;
  last_sale_date?: string;
}

export interface InventoryTransactionSummary {
  transaction_type: "purchase" | "sale";
  total_quantity: number;
  total_cost: number;
  transaction_count: number;
  last_transaction_date: string;
}

export class InventoryService {
  /**
   * Get comprehensive inventory summary by inventory item ID
   * @param inventoryId - The UUID of the inventory item
   * @returns Promise<InventorySummary | null>
   */
  async getInventorySummary(
    inventoryId: string
  ): Promise<InventorySummary | null> {
    try {
      // Get basic inventory item information with related data
      const { data: itemData, error: itemError } = await supabase
        .from("inventory_item_summary")
        .select(
          `
          id,
          name,
          sku,
          current_stock,
          low_stock_threshold,
          category_name,
          sub_category_name,
          brand_name,uom_name, total_in_cost, total_out_cost
        `
        )
        .eq("id", inventoryId)
        .single();

      if (itemError || !itemData) {
        console.error("Error fetching inventory item:", itemError);
        return null;
      }

      // Get transaction summary data
      const { data: transactionData, error: transactionError } = await supabase
        .from("inventory_transactions")
        .select(
          `
          transaction_type,
          qty_in,
          qty_out,
          in_cost,
          out_cost,
          transaction_date,
          status
        `
        )
        .eq("item_id", inventoryId)
        .eq("status", "completed");

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
        return null;
      }

      // Calculate summary statistics
      const summary = this.calculateInventorySummary(itemData, transactionData);

      return summary;
    } catch (error) {
      console.error("Error in getInventorySummary:", error);
      throw error;
    }
  }

  /**
   * Get inventory summary for multiple items
   * @param inventoryIds - Array of inventory item UUIDs
   * @returns Promise<InventorySummary[]>
   */
  async getBulkInventorySummary(
    inventoryIds: string[]
  ): Promise<InventorySummary[]> {
    try {
      const summaries = await Promise.all(
        inventoryIds.map((id) => this.getInventorySummary(id))
      );

      return summaries.filter(
        (summary): summary is InventorySummary => summary !== null
      );
    } catch (error) {
      console.error("Error in getBulkInventorySummary:", error);
      throw error;
    }
  }

  /**
   * Get inventory transaction summary by type
   * @param inventoryId - The UUID of the inventory item
   * @param transactionType - 'purchase' or 'sale'
   * @returns Promise<InventoryTransactionSummary | null>
   */
  async getTransactionSummaryByType(
    inventoryId: string,
    transactionType: "purchase" | "sale"
  ): Promise<InventoryTransactionSummary | null> {
    try {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(
          `
          transaction_type,
          qty_in,
          qty_out,
          in_cost,
          out_cost,
          transaction_date,
          status
        `
        )
        .eq("item_id", inventoryId)
        .eq("transaction_type", transactionType)
        .eq("status", "completed")
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Error fetching transaction summary:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const totalQuantity =
        transactionType === "purchase"
          ? data.reduce((sum, t) => sum + (t.qty_in || 0), 0)
          : data.reduce((sum, t) => sum + (t.qty_out || 0), 0);

      const totalCost =
        transactionType === "purchase"
          ? data.reduce((sum, t) => sum + (t.in_cost || 0), 0)
          : data.reduce((sum, t) => sum + (t.out_cost || 0), 0);

      return {
        transaction_type: transactionType,
        total_quantity: totalQuantity,
        total_cost: totalCost,
        transaction_count: data.length,
        last_transaction_date: data[0].transaction_date,
      };
    } catch (error) {
      console.error("Error in getTransactionSummaryByType:", error);
      throw error;
    }
  }

  /**
   * Calculate inventory summary from item data and transactions
   * @private
   */
  private calculateInventorySummary(
    itemData: any,
    transactions: any[]
  ): InventorySummary {
    // Calculate totals from transactions
    const totalInQuantity = transactions.reduce(
      (sum, t) => sum + (t.qty_in || 0),
      0
    );
    const totalOutQuantity = transactions.reduce(
      (sum, t) => sum + (t.qty_out || 0),
      0
    );
    const totalInCost = transactions.reduce(
      (sum, t) => sum + (t.in_cost || 0),
      0
    );
    const totalOutCost = transactions.reduce(
      (sum, t) => sum + (t.out_cost || 0),
      0
    );

    // Current stock calculation
    const currentStock = totalInQuantity - totalOutQuantity;

    // Check if low stock
    const lowStockThreshold = itemData.low_stock_threshold || 0;
    const isLowStock = currentStock <= lowStockThreshold;

    // Find last transaction dates
    const sortedTransactions = transactions.sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );

    const lastTransactionDate = sortedTransactions[0]?.transaction_date;
    const lastPurchaseDate = transactions
      .filter((t) => t.transaction_type === "purchase")
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      )[0]?.transaction_date;

    const lastSaleDate = transactions
      .filter((t) => t.transaction_type === "sale")
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      )[0]?.transaction_date;

    return {
      id: itemData.id,
      name: itemData.name,
      sku: itemData.sku,
      current_stock: currentStock,
      total_in_quantity: totalInQuantity,
      total_out_quantity: totalOutQuantity,
      total_in_cost: totalInCost,
      total_out_cost: totalOutCost,
      low_stock_threshold: lowStockThreshold,
      is_low_stock: isLowStock,
      category_name: itemData.category_name,
      sub_category_name: itemData.sub_category_name,
      brand_name: itemData.brands?.name,
      uom_name: itemData.uoms?.name,
      last_transaction_date: lastTransactionDate,
      last_purchase_date: lastPurchaseDate,
      last_sale_date: lastSaleDate,
    };
  }

  /**
   * Get low stock items across all inventory
   * @returns Promise<InventorySummary[]>
   */
  async getLowStockItems(): Promise<InventorySummary[]> {
    try {
      console.log("djdjdjitems getLowStockItems");
      const { data: items, error } = await supabase
        .from("low_stock_items")
        .select(
          `   
          id,
          name,
          sku,
          low_stock_threshold,
          category_name,
          sub_category_name,
          brand_name,
          uom_name,
          current_stock,
          total_in_cost,
          total_out_cost
        `
        );
      // .not("low_stock_threshold", "is", null)
      // .lte("current_stock", "low_stock_threshold");

      if (error) {
        console.error("Error fetching items with low stock threshold:", error);
        return [];
      }
      console.log("djdjdjitems", items);
      const lowStockItems: InventorySummary[] = [];

      for (const item of items) {
        const summary = await this.getInventorySummary(item.id);
        if (summary && summary.is_low_stock) {
          lowStockItems.push(summary);
        }
      }

      return lowStockItems;
    } catch (error) {
      console.error("Error in getLowStockItems:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const inventoryService = new InventoryService();
