import { Response, NextFunction } from "express";
import { AIService } from "../ai/ai.service";
import { AuthRequest } from "../middleware/auth";
import { sendResponse } from "../utils/response";
import prisma from "../config/database";
import { InterviewService } from "../services/interview.service";
import { ProctoringService } from "../services/proctoring.service";

const HIRING_RECOMMENDATIONS = ["STRONG_HIRE", "HIRE", "NO_HIRE", "STRONG_NO_HIRE"];

// Coerce a model-provided score into 0-100, or null if it isn't numeric.
const score = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

export class AIController {
  static async analyzeCode(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { code, language } = req.body;
      if (!code || !language) {
        return sendResponse(res, 400, null, "code and language are required");
      }

      const analysis = await AIService.analyzeCode(code, language);
      if (!analysis) {
        return sendResponse(res, 500, null, "AI analysis failed");
      }

      sendResponse(res, 200, analysis, "Code analyzed");
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { interviewId } = req.body;
      if (!interviewId) {
        return sendResponse(res, 400, null, "interviewId is required");
      }

      const { isStaff } = await InterviewService.assertAccess(
        String(interviewId),
        req.user!,
      );
      if (!isStaff) {
        return sendResponse(res, 403, null, "Only interview staff can do this");
      }

      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          codingSessions: true,
          cheatingLogs: { orderBy: { timestamp: "asc" } },
          chatMessages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!interview) {
        return sendResponse(res, 404, null, "Interview not found");
      }

      const reportData = {
        technicalPerformance: interview.codingSessions
          .map((s) => `Language: ${s.language}, Code: ${s.code}`)
          .join("\n"),
        communicationNotes: interview.chatMessages
          .map((m) => m.message)
          .join("\n"),
        codeSubmissions: interview.codingSessions.map((s) => s.code),
        cheatingEvents: interview.cheatingLogs.map((l) => ({
          type: l.eventType,
          severity: l.severity,
          details: l.details,
          at: l.timestamp,
        })),
        proctoringSummary: ProctoringService.summarize(interview.cheatingLogs),
      };

      const aiResult = await AIService.generateInterviewReport(reportData);
      const overallScore = score(aiResult?.overallScore);
      if (!aiResult || overallScore === null) {
        // Don't persist an empty report when the model returned unusable output.
        return sendResponse(res, 502, null, "AI report generation failed");
      }

      const hiring = String(aiResult.hiringRecommendation ?? "").toUpperCase();
      const report = await prisma.aIReport.create({
        data: {
          interviewId,
          technicalScore: score(aiResult.technicalScore),
          communicationScore: score(aiResult.communicationScore),
          confidenceScore: score(aiResult.confidenceScore),
          problemSolvingScore: score(aiResult.problemSolvingScore),
          codeQualityScore: score(aiResult.codeQualityScore),
          overallScore,
          summary:
            typeof aiResult.summary === "string" ? aiResult.summary : null,
          strengths: stringList(aiResult.strengths),
          weaknesses: stringList(aiResult.weaknesses),
          recommendations: stringList(aiResult.recommendations),
          hiringRecommendation: HIRING_RECOMMENDATIONS.includes(hiring)
            ? hiring
            : null,
        },
      });

      sendResponse(res, 201, report, "Interview report generated");
    } catch (error) {
      next(error);
    }
  }

  static async matchResume(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { resumeData, jobDescription } = req.body;
      if (!resumeData || !jobDescription) {
        return sendResponse(
          res,
          400,
          null,
          "resumeData and jobDescription are required",
        );
      }

      const result = await AIService.matchResumeToJob(
        resumeData,
        jobDescription,
      );
      if (!result) {
        return sendResponse(res, 500, null, "AI resume matching failed");
      }

      sendResponse(res, 200, result, "Resume matched");
    } catch (error) {
      next(error);
    }
  }

  static async analyzeSentiment(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return sendResponse(res, 400, null, "transcript is required");
      }

      const result = await AIService.analyzeSentiment(transcript);
      if (!result) {
        return sendResponse(res, 500, null, "AI sentiment analysis failed");
      }

      sendResponse(res, 200, result, "Sentiment analyzed");
    } catch (error) {
      next(error);
    }
  }

  static async getReportByInterview(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const interviewId = String(req.params.interviewId);
      const { isStaff } = await InterviewService.assertAccess(
        interviewId,
        req.user!,
      );
      if (!isStaff) {
        return sendResponse(res, 403, null, "Only interview staff can do this");
      }
      const reports = await prisma.aIReport.findMany({
        where: { interviewId },
        orderBy: { createdAt: "desc" },
      });

      sendResponse(res, 200, reports);
    } catch (error) {
      next(error);
    }
  }
}
