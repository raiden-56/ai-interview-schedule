import { Request, Response, NextFunction } from "express";
import { JobService } from "../services/job.service";
import { InterviewService } from "../services/interview.service";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { sendResponse, sendPaginatedResponse } from "../utils/response";

// Recruiters act on their own company; admins may target any company.
const resolveCompanyId = async (req: AuthRequest, requested?: unknown) => {
  if (req.user!.role === "ADMIN" && requested) return String(requested);
  const companyId = await InterviewService.getUserCompanyId(req.user!.id);
  if (!companyId) {
    throw new AppError("No company associated with this user", 400);
  }
  return companyId;
};

const assertJobOwnership = async (req: AuthRequest) => {
  const job = await JobService.getById(String(req.params.id));
  if (req.user!.role === "ADMIN") return job;
  const companyId = await InterviewService.getUserCompanyId(req.user!.id);
  if (job.companyId !== companyId) {
    throw new AppError("Job posting belongs to another company", 403);
  }
  return job;
};

export class JobController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, skills, experience, location, salary } =
        req.body;
      if (!title || !description) {
        return sendResponse(res, 400, null, "title and description are required");
      }
      const job = await JobService.create({
        title,
        description,
        skills: Array.isArray(skills) ? skills.map(String) : [],
        experience,
        location,
        salary,
        companyId: await resolveCompanyId(req, req.body.companyId),
      });
      sendResponse(res, 201, job, "Job posting created");
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10),
      );
      // Candidates may browse a specific company's postings; staff default to
      // their own company.
      const companyId =
        req.user!.role === "CANDIDATE"
          ? String(req.query.companyId || "")
          : await resolveCompanyId(req, req.query.companyId);

      if (!companyId) {
        return sendResponse(res, 400, null, "companyId is required");
      }

      const { jobs, total } = await JobService.getAll(companyId, page, limit);
      sendPaginatedResponse(res, jobs, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobService.getById(String(req.params.id));
      sendResponse(res, 200, job);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await assertJobOwnership(req);
      const { title, description, skills, experience, location, salary } =
        req.body;
      const job = await JobService.update(String(req.params.id), {
        title,
        description,
        skills: Array.isArray(skills) ? skills.map(String) : undefined,
        experience,
        location,
        salary,
      });
      sendResponse(res, 200, job, "Job posting updated");
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await assertJobOwnership(req);
      const job = await JobService.toggleActive(String(req.params.id));
      sendResponse(res, 200, job, "Job posting status toggled");
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await assertJobOwnership(req);
      await JobService.delete(String(req.params.id));
      sendResponse(res, 200, null, "Job posting deleted");
    } catch (error) {
      next(error);
    }
  }
}
