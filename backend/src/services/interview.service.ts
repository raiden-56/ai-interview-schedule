import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";

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
  static async create(input: CreateInterviewInput) {
    const interview = await prisma.interview.create({
      data: {
        title: input.title,
        description: input.description,
        candidateId: input.candidateId,
        recruiterId: input.recruiterId,
        companyId: input.companyId,
        jobPostingId: input.jobPostingId,
        scheduledAt: new Date(input.scheduledAt),
        duration: input.duration || 60,
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

  static async getById(id: string) {
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
        aiReports: true,
        cheatingLogs: true,
      },
    });

    if (!interview) {
      throw new AppError("Interview not found", 404);
    }

    return interview;
  }

  static async getByMeetingId(meetingId: string) {
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
        codingSessions: true,
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
          aiReports: { select: { overallScore: true } },
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
          aiReports: { select: { overallScore: true } },
        },
        orderBy: { scheduledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.interview.count({ where: { candidateId } }),
    ]);

    return { interviews, total };
  }

  static async updateStatus(
    id: string,
    status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  ) {
    const data: any = { status };

    if (status === "IN_PROGRESS") data.startedAt = new Date();
    if (status === "COMPLETED") data.endedAt = new Date();

    const interview = await prisma.interview.update({
      where: { id },
      data,
    });

    return interview;
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
