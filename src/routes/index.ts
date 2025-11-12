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
import supplierTransactionsRouter from "./supplier_transactions";
import academicSessionTermsRouter from "./academic_session_terms";
import classInventoryEntitlementsRouter from "./class_inventory_entitlements";
import studentInventoryLogRouter from "./student_inventory_log";
import inventorySummaryRouter from "./inventory_summary";
import notificationsRouter from "./notifications";
import rolesRouter from "./roles";
import rolePrivilegesRouter from "./role_privileges";
import userRolesRouter from "./user_roles";

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
  "/supplier_transactions",
  authenticateSupabaseToken,
  supplierTransactionsRouter
);
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
router.use(
  "/student_inventory_collection",
  authenticateSupabaseToken,
  studentInventoryLogRouter
);
router.use(
  "/inventory_summary",
  authenticateSupabaseToken,
  inventorySummaryRouter
);
router.use("/notifications", notificationsRouter);
router.use("/class_teachers", authenticateSupabaseToken, classTeachersRouter);
router.use("/roles", authenticateSupabaseToken, rolesRouter);
router.use("/role_privileges", authenticateSupabaseToken, rolePrivilegesRouter);
router.use("/user_roles", userRolesRouter);

export default router;
