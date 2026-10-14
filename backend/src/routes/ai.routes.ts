import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/code-feedback", authenticate, AIController.analyzeCode);
router.post(
  "/interview-report",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  AIController.generateReport,
);
router.post("/resume-match", authenticate, AIController.matchResume);
router.post("/sentiment", authenticate, AIController.analyzeSentiment);
router.get(
  "/reports/:interviewId",
  authenticate,
  AIController.getReportByInterview,
);

export default router;
