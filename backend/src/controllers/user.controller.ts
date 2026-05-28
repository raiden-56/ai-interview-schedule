import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse, sendPaginatedResponse } from "../utils/response";

export class UserController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(String(req.query.page) || "1", 10);
      const limit = parseInt(String(req.query.limit) || "10", 10);
      // RECRUITERs can only see CANDIDATE users
      const role =
        req.user?.role === "RECRUITER"
          ? "CANDIDATE"
          : req.query.role
            ? String(req.query.role)
            : undefined;
      const { users, total } = await UserService.getAll(page, limit, role);
      sendPaginatedResponse(res, users, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(String(req.params.id));
      sendResponse(res, 200, user);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(req.user!.id, req.body);
      sendResponse(res, 200, user, "Profile updated");
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { currentPassword, newPassword } = req.body;
      await UserService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword,
      );
      sendResponse(res, 200, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deactivate(String(req.params.id));
      sendResponse(res, 200, null, "User deactivated");
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.activate(String(req.params.id));
      sendResponse(res, 200, null, "User activated");
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const stats = await UserService.getDashboardStats();
      sendResponse(res, 200, stats);
    } catch (error) {
      next(error);
    }
  }
}
