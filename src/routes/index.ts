import classTeachersRouter from "./class_teachers";

import schoolClassesRouter from "./school_classes";
import studentsRouter from "./students";
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
import academicSessionTermsRouter from "./academic_session_terms";
import classInventoryEntitlementsRouter from "./class_inventory_entitlements";

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
router.use("/school_classes", authenticateSupabaseToken, schoolClassesRouter);
router.use("/students", authenticateSupabaseToken, studentsRouter);

router.use(
  "/academic_session_terms",
  authenticateSupabaseToken,
  academicSessionTermsRouter
);
router.use(
  "/class_inventory_entitlements",
  authenticateSupabaseToken,
  classInventoryEntitlementsRouter
);
router.use("/class_teachers", authenticateSupabaseToken, classTeachersRouter);

export default router;
