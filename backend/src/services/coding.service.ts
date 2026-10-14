import prisma from "../config/database";

export class CodingService {
  static async createSession(interviewId: string, language: string) {
    return prisma.codingSession.create({
      data: { interviewId, language },
    });
  }

  static async updateCode(sessionId: string, code: string, language?: string) {
    return prisma.codingSession.update({
      where: { id: sessionId },
      data: language ? { code, language } : { code },
    });
  }

  static async updateOutput(
    sessionId: string,
    output: string,
    testResults?: any,
  ) {
    return prisma.codingSession.update({
      where: { id: sessionId },
      data: { output, testResults },
    });
  }

  static async getSession(sessionId: string) {
    return prisma.codingSession.findUnique({
      where: { id: sessionId },
    });
  }

  static async getSessionsByInterview(interviewId: string) {
    return prisma.codingSession.findMany({
      where: { interviewId },
      orderBy: { createdAt: "desc" },
    });
  }
}
