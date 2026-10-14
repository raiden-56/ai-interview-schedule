import { Request, Response, NextFunction } from "express";
import { InterviewService } from "../services/interview.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse, sendPaginatedResponse } from "../utils/response";
import { ProctoringService } from "../services/proctoring.service";
import { emitToRoom } from "../sockets";

const parsePaging = (query: Request["query"]) => ({
  page: Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1),
  limit: Math.min(100, Math.max(1, parseInt(String(query.limit ?? "10"), 10) || 10)),
});

export class InterviewController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Always use the recruiter's own company; never trust a client-supplied id.
      const companyId =
        req.user!.role === "ADMIN" && req.body.companyId
          ? req.body.companyId
          : await InterviewService.getUserCompanyId(req.user!.id);

      if (!companyId) {
        return sendResponse(
          res,
          400,
          null,
          "No company associated with this recruiter",
        );
      }

      const { title, description, candidateId, jobPostingId, scheduledAt, duration } =
        req.body;
      if (!title || !candidateId || !scheduledAt) {
        return sendResponse(
          res,
          400,
          null,
          "title, candidateId and scheduledAt are required",
        );
      }

      const interview = await InterviewService.create({
        title,
        description,
        candidateId,
        jobPostingId: jobPostingId || undefined,
        scheduledAt,
        duration,
        companyId,
        recruiterId: req.user!.id,
      });
      sendResponse(res, 201, interview, "Interview created");
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const interview = await InterviewService.getById(
        String(req.params.id),
        req.user!,
      );
      sendResponse(res, 200, interview);
    } catch (error) {
      next(error);
    }
  }

  static async getByMeetingId(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const interview = await InterviewService.getByMeetingId(
        String(req.params.meetingId),
        req.user!,
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
      const { page, limit } = parsePaging(req.query);
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
      const { page, limit } = parsePaging(req.query);
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
        String(req.body.status),
        req.user!,
      );
      if (interview) {
        emitToRoom(interview.meetingId, "interview-status", {
          status: interview.status,
          startedAt: interview.startedAt,
          endedAt: interview.endedAt,
        });
      }
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
      const companyId = String(req.params.companyId);
      if (
        req.user!.role !== "ADMIN" &&
        (await InterviewService.getUserCompanyId(req.user!.id)) !== companyId
      ) {
        return sendResponse(res, 403, null, "Not a member of this company");
      }
      const analytics = await InterviewService.getAnalytics(companyId);
      sendResponse(res, 200, analytics);
    } catch (error) {
      next(error);
    }
  }

  static async reportProctoringEvent(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { interview } = await InterviewService.assertAccess(
        String(req.params.id),
        req.user!,
      );
      const { eventType, details, metadata } = req.body ?? {};
      const log = await ProctoringService.recordEvent(
        interview.id,
        req.user!.id,
        {
          eventType: String(eventType),
          details: details ? String(details) : undefined,
          metadata:
            metadata && typeof metadata === "object" ? metadata : undefined,
        },
      );

      // Duplicate within the dedupe window: acknowledge but don't re-broadcast.
      if (!log) return sendResponse(res, 200, null, "Duplicate event ignored");

      emitToRoom(interview.meetingId, "cheating-detected", log, {
        staffOnly: true,
      });
      sendResponse(res, 201, log, "Event recorded");
    } catch (error) {
      next(error);
    }
  }

  static async getProctoringReport(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { interview, isStaff } = await InterviewService.assertAccess(
        String(req.params.id),
        req.user!,
      );
      if (!isStaff) {
        return sendResponse(res, 403, null, "Proctoring data is staff-only");
      }
      const report = await ProctoringService.getReport(interview.id);
      sendResponse(res, 200, report);
    } catch (error) {
      next(error);
    }
  }
}
