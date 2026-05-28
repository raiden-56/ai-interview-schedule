import { Router } from "express";
import { InterviewController } from "../controllers/interview.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", authorize("RECRUITER", "ADMIN"), InterviewController.create);
router.get(
  "/recruiter",
  authorize("RECRUITER", "ADMIN"),
  InterviewController.listByRecruiter,
);
router.get(
  "/candidate",
  authorize("CANDIDATE"),
  InterviewController.listByCandidate,
);
router.get(
  "/analytics/:companyId",
  authorize("RECRUITER", "ADMIN"),
  InterviewController.getAnalytics,
);
router.get("/meeting/:meetingId", InterviewController.getByMeetingId);
router.get("/:id", InterviewController.getById);
router.patch(
  "/:id/status",
  authorize("RECRUITER", "ADMIN"),
  InterviewController.updateStatus,
);

export default router;
