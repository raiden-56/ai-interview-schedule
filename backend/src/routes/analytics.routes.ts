import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/dashboard", authenticate, AnalyticsController.getDashboardStats);
router.get(
  "/candidate",
  authenticate,
  AnalyticsController.getCandidateAnalytics,
);
router.get(
  "/candidate/:candidateId",
  authenticate,
  AnalyticsController.getCandidateAnalytics,
);
router.get(
  "/recruiter",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  AnalyticsController.getRecruiterAnalytics,
);

export default router;
