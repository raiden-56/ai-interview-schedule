import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "RECRUITER"), UserController.getAll);
router.get("/stats", authorize("ADMIN"), UserController.getDashboardStats);
router.get("/:id", UserController.getById);
router.patch("/profile", UserController.update);
router.patch("/change-password", UserController.changePassword);
router.patch("/:id/deactivate", authorize("ADMIN"), UserController.deactivate);
router.patch("/:id/activate", authorize("ADMIN"), UserController.activate);

export default router;
