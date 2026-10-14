import prisma from "../config/database";

export class AnalyticsService {
  static async getDashboardStats(
    userId: string,
    role: string,
    companyId?: string,
  ) {
    if (role === "RECRUITER" || role === "ADMIN") {
      const whereClause = companyId ? { companyId } : { recruiterId: userId };

      const [
        totalInterviews,
        scheduledInterviews,
        completedInterviews,
        totalCandidates,
      ] = await Promise.all([
        prisma.interview.count({ where: whereClause }),
        prisma.interview.count({
          where: { ...whereClause, status: "SCHEDULED" },
        }),
        prisma.interview.count({
          where: { ...whereClause, status: "COMPLETED" },
        }),
        prisma.user.count({ where: { role: "CANDIDATE" } }),
      ]);

      const avgScoreResult = await prisma.aIReport.aggregate({
        where: { interview: whereClause },
        _avg: { overallScore: true },
      });

      // Get weekly interview counts
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyInterviews = await prisma.interview.findMany({
        where: {
          ...whereClause,
          createdAt: { gte: oneWeekAgo },
        },
        select: { createdAt: true, status: true },
      });

      // Group by day
      const dailyCounts: Record<string, { interviews: number; date: string }> =
        {};
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dailyCounts[key] = { interviews: 0, date: days[d.getDay()] };
      }

      weeklyInterviews.forEach((int) => {
        const key = int.createdAt.toISOString().split("T")[0];
        if (dailyCounts[key]) dailyCounts[key].interviews++;
      });

      const chartData = Object.values(dailyCounts);

      // Status distribution
      const statusCounts = await prisma.interview.groupBy({
        by: ["status"],
        where: whereClause,
        _count: { status: true },
      });

      const statusDistribution = statusCounts.map((s) => ({
        name: s.status,
        value: s._count.status,
      }));

      // Recent interviews
      const recentInterviews = await prisma.interview.findMany({
        where: whereClause,
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          aiReports: {
            select: { overallScore: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return {
        stats: {
          totalInterviews,
          scheduledInterviews,
          completedInterviews,
          totalCandidates,
          avgScore: avgScoreResult._avg.overallScore || 0,
        },
        chartData,
        statusDistribution,
        recentInterviews: recentInterviews.map((int) => ({
          id: int.id,
          name: `${int.candidate.firstName} ${int.candidate.lastName}`,
          title: int.title,
          status: int.status,
          score: int.aiReports[0]?.overallScore || 0,
          scheduledAt: int.scheduledAt,
        })),
      };
    }

    // Candidate dashboard
    const [totalInterviews, completedInterviews, scheduledInterviews] =
      await Promise.all([
        prisma.interview.count({ where: { candidateId: userId } }),
        prisma.interview.count({
          where: { candidateId: userId, status: "COMPLETED" },
        }),
        prisma.interview.count({
          where: { candidateId: userId, status: "SCHEDULED" },
        }),
      ]);

    const avgScoreResult = await prisma.aIReport.aggregate({
      where: { interview: { candidateId: userId } },
      _avg: { overallScore: true },
    });

    const recentInterviews = await prisma.interview.findMany({
      where: { candidateId: userId },
      include: {
        company: { select: { name: true } },
        aiReports: {
          select: { overallScore: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    });

    return {
      stats: {
        totalInterviews,
        scheduledInterviews,
        completedInterviews,
        totalCandidates: 0,
        avgScore: avgScoreResult._avg.overallScore || 0,
      },
      chartData: [],
      statusDistribution: [],
      recentInterviews: recentInterviews.map((int) => ({
        id: int.id,
        name: int.company.name,
        title: int.title,
        status: int.status,
        score: int.aiReports[0]?.overallScore || 0,
        scheduledAt: int.scheduledAt,
      })),
    };
  }

  static async getCandidateAnalytics(candidateId: string) {
    const reports = await prisma.aIReport.findMany({
      where: { interview: { candidateId } },
      orderBy: { createdAt: "asc" },
      include: {
        interview: { select: { title: true, scheduledAt: true } },
      },
    });

    if (reports.length === 0) {
      return {
        scores: {
          overall: 0,
          technical: 0,
          communication: 0,
          confidence: 0,
          problemSolving: 0,
          codeQuality: 0,
        },
        radarData: [],
        performanceHistory: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        hiringRecommendation: null,
      };
    }

    const latest = reports[reports.length - 1];
    const avgScores = {
      overall: avg(reports.map((r) => r.overallScore)),
      technical: avg(reports.map((r) => r.technicalScore)),
      communication: avg(reports.map((r) => r.communicationScore)),
      confidence: avg(reports.map((r) => r.confidenceScore)),
      problemSolving: avg(reports.map((r) => r.problemSolvingScore)),
      codeQuality: avg(reports.map((r) => r.codeQualityScore)),
    };

    const radarData = [
      { subject: "Technical", score: avgScores.technical },
      { subject: "Communication", score: avgScores.communication },
      { subject: "Problem Solving", score: avgScores.problemSolving },
      { subject: "Code Quality", score: avgScores.codeQuality },
      { subject: "Confidence", score: avgScores.confidence },
    ];

    const performanceHistory = reports.map((r, i) => ({
      interview: r.interview.title || `Int #${i + 1}`,
      score: r.overallScore || 0,
    }));

    return {
      scores: avgScores,
      radarData,
      performanceHistory,
      strengths: latest.strengths,
      weaknesses: latest.weaknesses,
      recommendations: latest.recommendations,
      hiringRecommendation: latest.hiringRecommendation,
    };
  }

  static async getRecruiterAnalytics(recruiterId: string, companyId?: string) {
    const whereClause = companyId ? { companyId } : { recruiterId };

    const [totalInterviews, completedInterviews, hiredCount] =
      await Promise.all([
        prisma.interview.count({ where: whereClause }),
        prisma.interview.count({
          where: { ...whereClause, status: "COMPLETED" },
        }),
        prisma.aIReport.count({
          where: {
            interview: whereClause,
            hiringRecommendation: { in: ["STRONG_HIRE", "HIRE"] },
          },
        }),
      ]);

    const avgScores = await prisma.aIReport.aggregate({
      where: { interview: whereClause },
      _avg: {
        overallScore: true,
        technicalScore: true,
        communicationScore: true,
        confidenceScore: true,
        problemSolvingScore: true,
        codeQualityScore: true,
      },
    });

    // Top candidates
    const topCandidates = await prisma.aIReport.findMany({
      where: { interview: whereClause },
      orderBy: { overallScore: "desc" },
      take: 10,
      include: {
        interview: {
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
        },
      },
    });

    return {
      stats: {
        totalInterviews,
        completedInterviews,
        hiredCount,
        avgScore: avgScores._avg.overallScore || 0,
      },
      avgScores: {
        technical: avgScores._avg.technicalScore || 0,
        communication: avgScores._avg.communicationScore || 0,
        confidence: avgScores._avg.confidenceScore || 0,
        problemSolving: avgScores._avg.problemSolvingScore || 0,
        codeQuality: avgScores._avg.codeQualityScore || 0,
      },
      topCandidates: topCandidates.map((r) => ({
        candidateId: r.interview.candidate.id,
        name: `${r.interview.candidate.firstName} ${r.interview.candidate.lastName}`,
        email: r.interview.candidate.email,
        overallScore: r.overallScore,
        interviewTitle: r.interview.title,
        hiringRecommendation: r.hiringRecommendation,
      })),
    };
  }
}

function avg(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return 0;
  return (
    Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
  );
}
