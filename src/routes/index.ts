import { Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";
import { authenticateSupabaseToken } from "../middleware/auth";
const router = Router();

router.use("/users", authenticateSupabaseToken, usersRouter);
router.use("/auth", authRouter);

export default router;
