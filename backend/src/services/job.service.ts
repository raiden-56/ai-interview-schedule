import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";

interface CreateJobInput {
  title: string;
  description: string;
  skills: string[];
  experience?: string;
  location?: string;
  salary?: string;
  companyId: string;
}

export class JobService {
  static async create(input: CreateJobInput) {
    return prisma.jobPosting.create({
      data: input,
      include: {
        company: { select: { id: true, name: true } },
      },
    });
  }

  static async getAll(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where: { companyId },
        include: {
          company: { select: { id: true, name: true } },
          _count: { select: { interviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where: { companyId } }),
    ]);
    return { jobs, total };
  }

  static async getById(id: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        interviews: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: "desc" },
        },
      },
    });
    if (!job) throw new AppError("Job posting not found", 404);
    return job;
  }

  static async update(id: string, data: Partial<CreateJobInput>) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new AppError("Job posting not found", 404);

    return prisma.jobPosting.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
      },
    });
  }

  static async toggleActive(id: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new AppError("Job posting not found", 404);

    return prisma.jobPosting.update({
      where: { id },
      data: { isActive: !job.isActive },
    });
  }

  static async delete(id: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new AppError("Job posting not found", 404);

    return prisma.jobPosting.delete({ where: { id } });
  }
}
