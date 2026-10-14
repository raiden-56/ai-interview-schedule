import { Response, NextFunction } from "express";
import { CodingService } from "../services/coding.service";
import { InterviewService } from "../services/interview.service";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { sendResponse } from "../utils/response";

// Loads a session and checks the caller participates in its interview.
const loadAccessibleSession = async (req: AuthRequest) => {
  const session = await CodingService.getSession(String(req.params.id));
  if (!session) throw new AppError("Coding session not found", 404);
  const access = await InterviewService.assertAccess(
    session.interviewId,
    req.user!,
  );
  return { session, ...access };
};

export class CodingController {
  static async createSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { interviewId, language } = req.body;
      if (!interviewId || !language) {
        return sendResponse(
          res,
          400,
          null,
          "interviewId and language are required",
        );
      }

      await InterviewService.assertAccess(String(interviewId), req.user!);
      const session = await CodingService.createSession(interviewId, language);
      sendResponse(res, 201, session, "Coding session created");
    } catch (error) {
      next(error);
    }
  }

  static async updateCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code, language } = req.body;
      if (typeof code !== "string") {
        return sendResponse(res, 400, null, "code is required");
      }

      const { session: existing, interview, isStaff } =
        await loadAccessibleSession(req);
      // Candidates can't keep editing after submitting (or before starting).
      if (!isStaff && interview.status !== "IN_PROGRESS") {
        return sendResponse(res, 409, null, "Interview is not in progress");
      }

      const session = await CodingService.updateCode(
        existing.id,
        code,
        typeof language === "string" ? language : undefined,
      );
      sendResponse(res, 200, session, "Code updated");
    } catch (error) {
      next(error);
    }
  }

  static async updateOutput(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { output, testResults } = req.body;
      const { session: existing } = await loadAccessibleSession(req);

      const session = await CodingService.updateOutput(
        existing.id,
        String(output ?? ""),
        testResults,
      );
      sendResponse(res, 200, session, "Output updated");
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { session } = await loadAccessibleSession(req);
      sendResponse(res, 200, session);
    } catch (error) {
      next(error);
    }
  }

  static async getByInterview(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await InterviewService.assertAccess(
        String(req.params.interviewId),
        req.user!,
      );
      const sessions = await CodingService.getSessionsByInterview(
        String(req.params.interviewId),
      );
      sendResponse(res, 200, sessions);
    } catch (error) {
      next(error);
    }
  }
}
