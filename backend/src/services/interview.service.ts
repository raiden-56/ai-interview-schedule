import { InterviewStatus } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";

export interface Actor {
  id: string;
  role: string;
}

// Candidates may only move their own interview forward through these steps;
// recruiters/admins can set any status.
const CANDIDATE_TRANSITIONS: Partial<Record<InterviewStatus, InterviewStatus[]>> =
  {
    SCHEDULED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
  };

interface CreateInterviewInput {
  title: string;
  description?: string;
  candidateId: string;
  recruiterId: string;
  companyId: string;
  jobPostingId?: string;
  scheduledAt: Date;
  duration?: number;
}

export class InterviewService {
  static async getUserCompanyId(userId: string) {
    const company = await prisma.company.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (company) return company.id;
    const member = await prisma.companyMember.findUnique({
      where: { userId },
      select: { companyId: true },
    });
    return member?.companyId ?? null;
  }

  /**
   * Returns how the actor relates to the interview, throwing 404/403 if they
   * have no business seeing it. Recruiters from the same company count as staff.
   */
  static async assertAccess(interviewId: string, actor: Actor) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        candidateId: true,
        recruiterId: true,
        companyId: true,
        meetingId: true,
        status: true,
      },
    });
    if (!interview) throw new AppError("Interview not found", 404);

    if (actor.role === "ADMIN" || interview.recruiterId === actor.id) {
      return { interview, isStaff: true };
    }
    if (interview.candidateId === actor.id) {
      return { interview, isStaff: false };
    }
    if (actor.role === "RECRUITER") {
      const companyId = await this.getUserCompanyId(actor.id);
      if (companyId && companyId === interview.companyId) {
        return { interview, isStaff: true };
      }
    }
    throw new AppError("You do not have access to this interview", 403);
  }

  static async create(input: CreateInterviewInput) {
    const candidate = await prisma.user.findUnique({
      where: { id: input.candidateId },
      select: { role: true, isActive: true },
    });
    if (!candidate || candidate.role !== "CANDIDATE" || !candidate.isActive) {
      throw new AppError("candidateId must reference an active candidate", 400);
    }
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppError("scheduledAt must be a valid date", 400);
    }

    const interview = await prisma.interview.create({
      data: {
        title: input.title,
        description: input.description,
        candidateId: input.candidateId,
        recruiterId: input.recruiterId,
        companyId: input.companyId,
        jobPostingId: input.jobPostingId,
        scheduledAt,
        duration: Number(input.duration) || 60,
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
      },
    });

    return interview;
  }

  static async getById(id: string, actor: Actor) {
    const { isStaff } = await this.assertAccess(id, actor);

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        company: { select: { id: true, name: true } },
        codingSessions: true,
        aiReports: isStaff,
        cheatingLogs: isStaff ? { orderBy: { timestamp: "asc" } } : false,
      },
    });

    if (!interview) {
      throw new AppError("Interview not found", 404);
    }

    return interview;
  }

  static async getByMeetingId(meetingId: string, actor: Actor) {
    const found = await prisma.interview.findUnique({
      where: { meetingId },
      select: { id: true },
    });
    if (!found) throw new AppError("Interview not found", 404);
    await this.assertAccess(found.id, actor);

    const interview = await prisma.interview.findUnique({
      where: { meetingId },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        codingSessions: { orderBy: { createdAt: "desc" } },
        chatMessages: { orderBy: { createdAt: "asc" }, take: 200 },
      },
    });

    if (!interview) {
      throw new AppError("Interview not found", 404);
    }

    return interview;
  }

  static async listByRecruiter(recruiterId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where: { recruiterId },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          company: { select: { id: true, name: true } },
          aiReports: {
            select: { overallScore: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { cheatingLogs: true } },
        },
        orderBy: { scheduledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.interview.count({ where: { recruiterId } }),
    ]);

    return { interviews, total };
  }

  static async listByCandidate(candidateId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where: { candidateId },
        include: {
          recruiter: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          aiReports: {
            select: { overallScore: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { scheduledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.interview.count({ where: { candidateId } }),
    ]);

    return { interviews, total };
  }

  static async updateStatus(id: string, status: string, actor: Actor) {
    if (!Object.values(InterviewStatus).includes(status as InterviewStatus)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }
    const next = status as InterviewStatus;
    const { interview, isStaff } = await this.assertAccess(id, actor);

    if (!isStaff && !CANDIDATE_TRANSITIONS[interview.status]?.includes(next)) {
      throw new AppError(
        `Cannot change interview from ${interview.status} to ${next}`,
        403,
      );
    }
    if (interview.status === next) {
      return prisma.interview.findUnique({ where: { id } });
    }

    const data: { status: InterviewStatus; startedAt?: Date; endedAt?: Date } =
      { status: next };
    if (next === "IN_PROGRESS") data.startedAt = new Date();
    if (next === "COMPLETED" || next === "CANCELLED") data.endedAt = new Date();

    return prisma.interview.update({ where: { id }, data });
  }

  static async getAnalytics(companyId: string) {
    const [total, completed, scheduled, avgScore] = await Promise.all([
      prisma.interview.count({ where: { companyId } }),
      prisma.interview.count({ where: { companyId, status: "COMPLETED" } }),
      prisma.interview.count({ where: { companyId, status: "SCHEDULED" } }),
      prisma.aIReport.aggregate({
        where: { interview: { companyId } },
        _avg: { overallScore: true },
      }),
    ]);

    return {
      total,
      completed,
      scheduled,
      inProgress: total - completed - scheduled,
      averageScore: avgScore._avg.overallScore || 0,
    };
  }
}
