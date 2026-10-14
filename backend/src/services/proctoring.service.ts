import { CheatingEventType, Prisma, Severity } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";

const EVENT_TYPES = Object.values(CheatingEventType) as string[];

// Base severity per event, and the number of occurrences after which
// it escalates one level (repeat offences are far more suspicious).
const RULES: Record<
  CheatingEventType,
  { base: Severity; escalateAfter?: number }
> = {
  TAB_SWITCH: { base: "MEDIUM", escalateAfter: 3 },
  BROWSER_BLUR: { base: "LOW", escalateAfter: 5 },
  COPY_PASTE: { base: "LOW", escalateAfter: 5 },
  EXTERNAL_PASTE: { base: "HIGH", escalateAfter: 2 },
  FULLSCREEN_EXIT: { base: "MEDIUM", escalateAfter: 3 },
  KEYBOARD_INACTIVITY: { base: "LOW" },
  MULTIPLE_FACES: { base: "CRITICAL" },
  NO_FACE: { base: "HIGH", escalateAfter: 3 },
  EYE_MOVEMENT: { base: "MEDIUM", escalateAfter: 5 },
  CAMERA_OFF: { base: "HIGH", escalateAfter: 2 },
  DEVTOOLS_OPEN: { base: "HIGH", escalateAfter: 2 },
  MULTIPLE_SCREENS: { base: "HIGH" },
};

const SEVERITY_ORDER: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Points deducted from a 100-point integrity score per event.
const SEVERITY_WEIGHT: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 8,
  CRITICAL: 15,
};

// Ignore exact duplicates fired within this window (e.g. blur + visibility
// change firing for the same tab switch, or a flaky detector).
const DEDUPE_WINDOW_MS = 1500;

export interface ProctoringEventInput {
  eventType: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export class ProctoringService {
  static async recordEvent(
    interviewId: string,
    userId: string,
    input: ProctoringEventInput,
  ) {
    if (!EVENT_TYPES.includes(input.eventType)) {
      throw new AppError(`Unknown event type: ${input.eventType}`, 400);
    }
    const eventType = input.eventType as CheatingEventType;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { id: true, candidateId: true, status: true },
    });
    if (!interview) throw new AppError("Interview not found", 404);
    if (interview.candidateId !== userId) {
      throw new AppError("Only the candidate can report proctoring events", 403);
    }
    if (interview.status === "COMPLETED" || interview.status === "CANCELLED") {
      throw new AppError("Interview is not active", 409);
    }

    const [previousCount, lastSame] = await Promise.all([
      prisma.cheatingLog.count({ where: { interviewId, eventType } }),
      prisma.cheatingLog.findFirst({
        where: { interviewId, eventType },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
    ]);

    if (
      lastSame &&
      Date.now() - lastSame.timestamp.getTime() < DEDUPE_WINDOW_MS
    ) {
      return null;
    }

    const severity = this.computeSeverity(
      eventType,
      previousCount + 1,
      input.metadata,
    );

    return prisma.cheatingLog.create({
      data: {
        interviewId,
        eventType,
        severity,
        details: input.details?.slice(0, 500),
        metadata: (input.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  static computeSeverity(
    eventType: CheatingEventType,
    occurrence: number,
    metadata?: Record<string, unknown>,
  ): Severity {
    const rule = RULES[eventType];
    let level = SEVERITY_ORDER.indexOf(rule.base);

    if (rule.escalateAfter && occurrence > rule.escalateAfter) level += 1;

    // Large pastes are worse than small ones.
    const pasteLength = Number(metadata?.length ?? 0);
    if (eventType === "EXTERNAL_PASTE" && pasteLength > 200) level += 1;

    return SEVERITY_ORDER[Math.min(level, SEVERITY_ORDER.length - 1)];
  }

  static async getReport(interviewId: string) {
    const logs = await prisma.cheatingLog.findMany({
      where: { interviewId },
      orderBy: { timestamp: "asc" },
    });
    return { logs, summary: this.summarize(logs) };
  }

  static summarize(
    logs: { eventType: CheatingEventType; severity: Severity }[],
  ) {
    const byType: Partial<Record<CheatingEventType, number>> = {};
    const bySeverity: Record<Severity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    let penalty = 0;

    for (const log of logs) {
      byType[log.eventType] = (byType[log.eventType] ?? 0) + 1;
      bySeverity[log.severity] += 1;
      penalty += SEVERITY_WEIGHT[log.severity];
    }

    const integrityScore = Math.max(0, 100 - penalty);
    const riskLevel: Severity =
      bySeverity.CRITICAL > 0 || integrityScore < 40
        ? "CRITICAL"
        : integrityScore < 60
          ? "HIGH"
          : integrityScore < 85
            ? "MEDIUM"
            : "LOW";

    return {
      totalEvents: logs.length,
      integrityScore,
      riskLevel,
      byType,
      bySeverity,
    };
  }
}
