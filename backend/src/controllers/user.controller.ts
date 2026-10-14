import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse, sendPaginatedResponse } from "../utils/response";

export class UserController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10),
      );
      // RECRUITERs can only see CANDIDATE users
      const role =
        req.user?.role === "RECRUITER"
          ? "CANDIDATE"
          : ["ADMIN", "RECRUITER", "CANDIDATE"].includes(String(req.query.role))
            ? String(req.query.role)
            : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const { users, total } = await UserService.getAll(
        page,
        limit,
        role,
        search,
      );
      sendPaginatedResponse(res, users, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      if (req.user!.role === "CANDIDATE" && id !== req.user!.id) {
        return sendResponse(res, 403, null, "Insufficient permissions");
      }
      const user = await UserService.getById(id);
      sendResponse(res, 200, user);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Whitelist editable fields — passing req.body through would let users
      // set their own role, password hash or isActive.
      const { firstName, lastName, phone, avatar } = req.body ?? {};
      const data = Object.fromEntries(
        Object.entries({ firstName, lastName, phone, avatar })
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => [key, (value as string).trim()]),
      );
      if (data.firstName === "" || data.lastName === "") {
        return sendResponse(res, 400, null, "Name fields cannot be empty");
      }
      const user = await UserService.update(req.user!.id, data);
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
      const { currentPassword, newPassword } = req.body ?? {};
      if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
        return sendResponse(
          res,
          400,
          null,
          "currentPassword and newPassword are required",
        );
      }
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
