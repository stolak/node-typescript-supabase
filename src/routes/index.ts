import inventoryTransactionsRouter from "./inventory_transactions";
import { Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";
import { authenticateSupabaseToken } from "../middleware/auth";
import categoriesRouter from "./categories";
import subCategoriesRouter from "./sub_categories";
import brandsRouter from "./brands";
import uomsRouter from "./uoms";
import inventoryItemsRouter from "./inventory_items";
import suppliersRouter from "./suppliers";

const router = Router();

router.use("/users", authenticateSupabaseToken, usersRouter);
router.use("/auth", authRouter);
router.use("/categories", authenticateSupabaseToken, categoriesRouter);
router.use("/sub_categories", authenticateSupabaseToken, subCategoriesRouter);
router.use("/brands", authenticateSupabaseToken, brandsRouter);
router.use("/uoms", authenticateSupabaseToken, uomsRouter);
router.use("/inventory_items", authenticateSupabaseToken, inventoryItemsRouter);
router.use("/suppliers", authenticateSupabaseToken, suppliersRouter);
router.use(
  "/inventory_transactions",
  authenticateSupabaseToken,
  inventoryTransactionsRouter
);

export default router;
