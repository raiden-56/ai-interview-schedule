import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  JobController.create,
);
router.get("/", authenticate, JobController.getAll);
router.get("/:id", authenticate, JobController.getById);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  JobController.update,
);
router.patch(
  "/:id/toggle",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  JobController.toggleActive,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "RECRUITER"),
  JobController.delete,
);

export default router;
