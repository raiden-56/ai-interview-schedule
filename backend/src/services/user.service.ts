import bcryptjs from "bcryptjs";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class UserService {
  static async getAll(page = 1, limit = 10, role?: string) {
    const skip = (page - 1) * limit;
    const where = role ? { role: role as any } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        company: true,
        companyMember: { include: { company: true } },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  static async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
      },
    });
  }

  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    const isValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password is incorrect", 400);

    if (newPassword.length < 8)
      throw new AppError("New password must be at least 8 characters", 400);

    const hashed = await bcryptjs.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
  }

  static async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async activate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  static async getDashboardStats() {
    const [totalUsers, recruiters, candidates, activeUsers] = await Promise.all(
      [
        prisma.user.count(),
        prisma.user.count({ where: { role: "RECRUITER" } }),
        prisma.user.count({ where: { role: "CANDIDATE" } }),
        prisma.user.count({ where: { isActive: true } }),
      ],
    );

    return { totalUsers, recruiters, candidates, activeUsers };
  }
}
