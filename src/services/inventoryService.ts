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
export interface InventoryBalance {
  inventory_item_id: string;
  total_distributed: number;
  total_received: number;
  balance_quantity: number;
}

export interface DistributionSummary {
  inventory_item_id: string;
  item_name?: string;
  inventory_items?: {
    id: string;
    name: string;
    sku?: string;
    categories?: { id: string; name: string } | null;
  };
  total_received_quantity: number;
  total_distributed_quantity: number;
  balance_quantity: number;
  last_distribution_date?: string;
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

      return items as InventorySummary[];
    } catch (error) {
      console.error("Error in getLowStockItems:", error);
      throw error;
    }
  }

  /**
   * Get distribution summary for class inventory and student logs
   * @param filters - Optional filters: inventory_item_id, class_id, session_term_id, teacher_id
   * @returns Promise<DistributionSummary[]>
   */
  async getDistributionSummary(filters: {
    inventory_item_id?: string;
    class_id?: string;
    session_term_id?: string;
    teacher_id?: string;
  }): Promise<DistributionSummary[]> {
    const { inventory_item_id, class_id, session_term_id, teacher_id } =
      filters;

    try {
      // Base query builder for class_inventory_distributions
      let distQuery = supabase.from("class_inventory_distributions").select(
        `
        inventory_item_id,
        distributed_quantity,
        distribution_date,
        received_by,
        session_term_id,
        inventory_items(id, name, sku, categories(id, name))
      `
      );

      // Apply optional filters
      if (inventory_item_id)
        distQuery = distQuery.eq("inventory_item_id", inventory_item_id);
      if (class_id) distQuery = distQuery.eq("class_id", class_id);
      if (session_term_id)
        distQuery = distQuery.eq("session_term_id", session_term_id);
      if (teacher_id) distQuery = distQuery.eq("received_by", teacher_id);

      const { data: distributions, error: distError } = await distQuery;

      if (distError) {
        console.error("Error fetching class distributions:", distError);
        return [];
      }

      // Base query builder for student_inventory_log
      let logQuery = supabase
        .from("student_inventory_log")
        .select(
          `
        inventory_item_id,
        qty,
        received,
        received_date,
        given_by,
        session_term_id
      `
        )
        .eq("received", true); // only received items

      if (inventory_item_id)
        logQuery = logQuery.eq("inventory_item_id", inventory_item_id);
      if (class_id) logQuery = logQuery.eq("class_id", class_id);
      if (session_term_id)
        logQuery = logQuery.eq("session_term_id", session_term_id);
      if (teacher_id) logQuery = logQuery.eq("given_by", teacher_id);

      const { data: logs, error: logError } = await logQuery;

      if (logError) {
        console.error("Error fetching student inventory logs:", logError);
        return [];
      }

      // Aggregate data by inventory_item_id
      const summaryMap: Record<string, DistributionSummary> = {};

      // Process class distributions
      for (const dist of distributions || []) {
        const key = dist.inventory_item_id;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            inventory_item_id: key,
            total_received_quantity: 0,
            total_distributed_quantity: 0,
            balance_quantity: 0,
          };
        }
        summaryMap[key].total_received_quantity +=
          dist.distributed_quantity || 0;

        // Attach item details once (from class distributions query)
        if (!summaryMap[key].inventory_items && (dist as any).inventory_items) {
          const it = (dist as any).inventory_items;
          summaryMap[key].inventory_items = {
            id: it.id,
            name: it.name,
            sku: it.sku,
            categories: it.categories
              ? { id: it.categories.id, name: it.categories.name }
              : null,
          };
          summaryMap[key].item_name = it.name;
        }

        // Track last distribution date
        if (
          !summaryMap[key].last_distribution_date ||
          new Date(dist.distribution_date) >
            new Date(summaryMap[key].last_distribution_date!)
        ) {
          summaryMap[key].last_distribution_date = dist.distribution_date;
        }
      }

      // Process student logs
      for (const log of logs || []) {
        const key = log.inventory_item_id;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            inventory_item_id: key,
            total_received_quantity: 0,
            total_distributed_quantity: 0,
            balance_quantity: 0,
          };
        }
        summaryMap[key].total_distributed_quantity += log.qty || 0;
      }

      // Compute balance
      for (const key of Object.keys(summaryMap)) {
        const item = summaryMap[key];
        item.balance_quantity =
          item.total_received_quantity - item.total_distributed_quantity;
      }

      return Object.values(summaryMap);
    } catch (error) {
      console.error("Error in getDistributionSummary:", error);
      throw error;
    }
  }

  async getInventoryBalance(filters: {
    inventory_item_id?: string;
    class_id?: string;
    session_term_id?: string;
    teacher_id?: string;
  }): Promise<InventoryBalance[]> {
    try {
      const { inventory_item_id, class_id, session_term_id, teacher_id } =
        filters;

      const { data, error } = await supabase.rpc("get_inventory_balance", {
        _inventory_item_id: inventory_item_id ?? null,
        _class_id: class_id ?? null,
        _session_term_id: session_term_id ?? null,
        _teacher_id: teacher_id ?? null,
      });

      if (error) {
        console.error("Error calling get_inventory_balance:", error);
        throw error;
      }

      return data as InventoryBalance[];
    } catch (error) {
      console.error("Error in getInventoryBalance service:", error);
      throw error;
    }
  }

  async getAllInventoryItems(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching all inventory items:", error);
        throw error;
      }
      return data as { id: string; name: string }[];
    } catch (error) {
      console.error("Error in getAllInventoryItems service:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const inventoryService = new InventoryService();
