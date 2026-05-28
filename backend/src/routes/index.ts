import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import interviewRoutes from "./interview.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/interviews", interviewRoutes);

export default router;
