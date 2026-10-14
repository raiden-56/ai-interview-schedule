import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import logger from "../config/logger";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "RECRUITER" | "CANDIDATE";
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static generateAccessToken(payload: {
    id: string;
    email: string;
    role: string;
  }) {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: { id: string }) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await bcryptjs.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || "CANDIDATE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-create company for recruiters
    if (user.role === "RECRUITER") {
      const company = await prisma.company.create({
        data: {
          name: `${user.firstName}'s Company`,
          ownerId: user.id,
        },
      });

      await prisma.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "owner",
        },
      });
    }

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    logger.info(`User registered: ${user.email}`);

    return { user, accessToken, refreshToken };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    const isPasswordValid = await bcryptjs.compare(
      input.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
        id: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== token) {
        throw new AppError("Invalid refresh token", 401);
      }

      const accessToken = this.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = this.generateRefreshToken({ id: user.id });

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AppError("Invalid refresh token", 401);
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    logger.info(`User logged out: ${userId}`);
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        company: true,
        companyMember: { include: { company: true } },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
