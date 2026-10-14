import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse } from "../utils/response";

export class AnalyticsController {
  static async getDashboardStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const companyId = req.query.companyId as string | undefined;

      const data = await AnalyticsService.getDashboardStats(
        userId,
        role,
        companyId,
      );
      sendResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  static async getCandidateAnalytics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const candidateId = (req.params.candidateId || req.user!.id) as string;
      if (req.user!.role === "CANDIDATE" && candidateId !== req.user!.id) {
        return sendResponse(res, 403, null, "Insufficient permissions");
      }
      const data = await AnalyticsService.getCandidateAnalytics(candidateId);
      sendResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  static async getRecruiterAnalytics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.query.companyId as string | undefined;
      const data = await AnalyticsService.getRecruiterAnalytics(
        recruiterId,
        companyId,
      );
      sendResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  }
}
