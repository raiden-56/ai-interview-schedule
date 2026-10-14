import { Router } from "express";
import { CodingController } from "../controllers/coding.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, CodingController.createSession);
router.get("/:id", authenticate, CodingController.getSession);
router.get(
  "/interview/:interviewId",
  authenticate,
  CodingController.getByInterview,
);
router.patch("/:id/code", authenticate, CodingController.updateCode);
router.patch("/:id/output", authenticate, CodingController.updateOutput);

export default router;
