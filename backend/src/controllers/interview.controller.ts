import { Request, Response, NextFunction } from "express";
import { InterviewService } from "../services/interview.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse, sendPaginatedResponse } from "../utils/response";

export class InterviewController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const interview = await InterviewService.create({
        ...req.body,
        recruiterId: req.user!.id,
      });
      sendResponse(res, 201, interview, "Interview created");
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await InterviewService.getById(String(req.params.id));
      sendResponse(res, 200, interview);
    } catch (error) {
      next(error);
    }
  }

  static async getByMeetingId(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await InterviewService.getByMeetingId(
        String(req.params.meetingId),
      );
      sendResponse(res, 200, interview);
    } catch (error) {
      next(error);
    }
  }

  static async listByRecruiter(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const page = parseInt(String(req.query.page) || "1", 10);
      const limit = parseInt(String(req.query.limit) || "10", 10);
      const { interviews, total } = await InterviewService.listByRecruiter(
        req.user!.id,
        page,
        limit,
      );
      sendPaginatedResponse(res, interviews, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async listByCandidate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const page = parseInt(String(req.query.page) || "1", 10);
      const limit = parseInt(String(req.query.limit) || "10", 10);
      const { interviews, total } = await InterviewService.listByCandidate(
        req.user!.id,
        page,
        limit,
      );
      sendPaginatedResponse(res, interviews, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const interview = await InterviewService.updateStatus(
        String(req.params.id),
        req.body.status,
      );
      sendResponse(res, 200, interview, "Status updated");
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const analytics = await InterviewService.getAnalytics(
        String(req.params.companyId),
      );
      sendResponse(res, 200, analytics);
    } catch (error) {
      next(error);
    }
  }
}
