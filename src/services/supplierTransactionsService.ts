import { supabase } from "../supabaseClient";

export interface SupplierTransactionInput {
  supplier_id: string;
  transaction_date?: string;
  credit: number;
  debit: number;
  reference_no?: string;
  notes?: string;
  created_by?: string;
}

export interface SupplierTransaction extends SupplierTransactionInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export default class SupplierTransactionsService {
  private table = "supplier_transactions";

  async getAll(filters?: {
    supplier_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<SupplierTransaction[]> {
    let query: any = supabase.from(this.table).select("*");
    if (filters?.supplier_id)
      query = query.eq("supplier_id", filters.supplier_id);
    if (filters?.from_date)
      query = query.gte("transaction_date", filters.from_date);
    if (filters?.to_date)
      query = query.lte("transaction_date", filters.to_date);
    const { data, error } = await query.order("transaction_date", {
      ascending: false,
    });
    if (error) throw error;
    return data as SupplierTransaction[];
  }

  async getById(id: string): Promise<SupplierTransaction | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if ((error as any).code === "PGRST116") return null;
      throw error;
    }
    return data as SupplierTransaction | null;
  }

  async create(
    payload: SupplierTransactionInput
  ): Promise<SupplierTransaction> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as SupplierTransaction;
  }

  async update(
    id: string,
    payload: Partial<SupplierTransactionInput>
  ): Promise<SupplierTransaction> {
    const { data, error } = await supabase
      .from(this.table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as SupplierTransaction;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(this.table).delete().eq("id", id);
    if (error) throw error;
  }

  async bulkUpsert(
    items: (SupplierTransactionInput & { id?: string })[]
  ): Promise<SupplierTransaction[]> {
    if (!Array.isArray(items)) throw new Error("items must be an array");
    const { data, error } = await supabase
      .from(this.table)
      .upsert(items, { onConflict: "id" })
      .select();
    if (error) throw error;
    return data as SupplierTransaction[];
  }
}
