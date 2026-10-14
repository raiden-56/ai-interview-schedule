import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import interviewRoutes from "./interview.routes";
import jobRoutes from "./job.routes";
import aiRoutes from "./ai.routes";
import codingRoutes from "./coding.routes";
import analyticsRoutes from "./analytics.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/interviews", interviewRoutes);
router.use("/jobs", jobRoutes);
router.use("/ai", aiRoutes);
router.use("/coding", codingRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
