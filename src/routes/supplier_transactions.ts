import { Router, Request, Response } from "express";
import SupplierTransactionsService from "../services/supplierTransactionsService";
import { authenticateSupabaseToken } from "../middleware/auth";

const router = Router();
const service = new SupplierTransactionsService();

/**
 * @openapi
 * /api/v1/supplier_transactions:
 *   get:
 *     summary: Get supplier transactions
 *     tags:
 *       - SupplierTransactions
 *     parameters:
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of supplier transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupplierTransaction'
 *   post:
 *     summary: Create a supplier transaction
 *     tags:
 *       - SupplierTransactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierTransactionInput'
 *     responses:
 *       201:
 *         description: Supplier transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierTransaction'
 */
router.get(
  "/",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const { supplier_id, from_date, to_date } = req.query as Record<
        string,
        string | undefined
      >;
      const data = await service.getAll({ supplier_id, from_date, to_date });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

router.post(
  "/",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const {
        supplier_id,
        transaction_date,
        credit,
        debit,
        reference_no,
        notes,
        created_by,
      } = req.body;
      if (!supplier_id || credit === undefined || debit === undefined) {
        return res
          .status(400)
          .json({ error: "supplier_id, credit and debit are required" });
      }
      const payload = {
        supplier_id,
        transaction_date,
        credit: Number(credit),
        debit: Number(debit),
        reference_no,
        notes,
        created_by: req.user?.id || created_by,
      };
      const data = await service.create(payload);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

/**
 * @openapi
 * /api/v1/supplier_transactions/{id}:
 *   get:
 *     summary: Get a supplier transaction by id
 *     tags:
 *       - SupplierTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *   put:
 *     summary: Update a supplier transaction
 *     tags:
 *       - SupplierTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierTransactionInput'
 *   delete:
 *     summary: Delete a supplier transaction
 *     tags:
 *       - SupplierTransactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/:id",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await service.getById(id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

router.put(
  "/:id",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { transaction_date, credit, debit, reference_no, notes } = req.body;
      const payload: any = {};
      if (transaction_date !== undefined)
        payload.transaction_date = transaction_date;
      if (credit !== undefined) payload.credit = Number(credit);
      if (debit !== undefined) payload.debit = Number(debit);
      if (reference_no !== undefined) payload.reference_no = reference_no;
      if (notes !== undefined) payload.notes = notes;
      const data = await service.update(id, payload);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

router.delete(
  "/:id",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await service.remove(id);
      res.status(200).json({ message: "deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

/**
 * @openapi
 * /api/v1/supplier_transactions/bulk_upsert:
 *   post:
 *     summary: Bulk upsert supplier transactions
 *     tags:
 *       - SupplierTransactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/SupplierTransactionInput'
 *     responses:
 *       200:
 *         description: Upsert result
 */
router.post(
  "/bulk_upsert",
  authenticateSupabaseToken,
  async (req: Request, res: Response) => {
    try {
      const items = req.body;
      if (!Array.isArray(items))
        return res.status(400).json({ error: "Array expected" });
      const data = await service.bulkUpsert(items);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err });
    }
  }
);

/**
 * @openapi
 * components:
 *   schemas:
 *     SupplierTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         transaction_date:
 *           type: string
 *           format: date-time
 *         credit:
 *           type: number
 *         debit:
 *           type: number
 *         reference_no:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     SupplierTransactionInput:
 *       type: object
 *       required:
 *         - supplier_id
 *         - credit
 *         - debit
 *       properties:
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         transaction_date:
 *           type: string
 *           format: date-time
 *         credit:
 *           type: number
 *         debit:
 *           type: number
 *         reference_no:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: string
 *           format: uuid
 */

export default router;
