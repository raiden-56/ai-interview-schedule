import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Assessment,
  TrendingUp,
  EmojiEvents,
  Psychology,
} from "@mui/icons-material";
import { useAppSelector } from "../../hooks/useRedux";
import { analyticsAPI } from "../../services/api";

export default function AnalyticsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const role = user?.role;
        let res;
        if (role === "CANDIDATE") {
          res = await analyticsAPI.getCandidateAnalytics();
        } else {
          res = await analyticsAPI.getRecruiterAnalytics();
        }
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user?.role]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // For candidate view
  if (user?.role === "CANDIDATE") {
    const scores = data?.scores || {
      overall: 0,
      technical: 0,
      communication: 0,
      confidence: 0,
      problemSolving: 0,
      codeQuality: 0,
    };
    const radarData = data?.radarData || [];
    const performanceHistory = data?.performanceHistory || [];
    const strengths = data?.strengths || [];
    const weaknesses = data?.weaknesses || [];
    const hiringRecommendation = data?.hiringRecommendation;

    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Analytics & AI Reports
          </Typography>
          <Typography color="text.secondary">
            AI-powered insights from your interview performance
          </Typography>
        </Box>

        {/* Score Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: "Overall Score",
              value: scores.overall,
              icon: <Assessment />,
              color: "#7C4DFF",
            },
            {
              title: "Technical",
              value: scores.technical,
              icon: <TrendingUp />,
              color: "#00C853",
            },
            {
              title: "Best Score",
              value: Math.max(
                scores.overall,
                scores.technical,
                scores.communication,
                scores.codeQuality,
              ),
              icon: <EmojiEvents />,
              color: "#FFB300",
            },
            {
              title: "Confidence",
              value: scores.confidence,
              icon: <Psychology />,
              color: "#00E5FF",
            },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: item.color }}
                  >
                    {item.value || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Skill Assessment
              </Typography>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(124,77,255,0.2)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#B0BEC5", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#7C4DFF"
                      fill="rgba(124,77,255,0.3)"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    Complete interviews to see skill assessment
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Performance Trend
              </Typography>
              {performanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="interview" stroke="#B0BEC5" />
                    <YAxis stroke="#B0BEC5" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#121A2B",
                        border: "1px solid rgba(124,77,255,0.2)",
                      }}
                    />
                    <Bar dataKey="score" fill="#7C4DFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No performance data yet
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                AI Strengths Analysis
              </Typography>
              {strengths.length > 0 ? (
                <Stack spacing={2}>
                  {strengths.map((item: string, i: number) => (
                    <Box
                      key={i}
                      sx={{ display: "flex", alignItems: "center", gap: 2 }}
                    >
                      <Chip label="✓" size="small" color="success" />
                      <Typography>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No strengths data yet
                </Typography>
              )}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Areas for Improvement
              </Typography>
              {weaknesses.length > 0 ? (
                <Stack spacing={2}>
                  {weaknesses.map((item: string, i: number) => (
                    <Box
                      key={i}
                      sx={{ display: "flex", alignItems: "center", gap: 2 }}
                    >
                      <Chip label="!" size="small" color="warning" />
                      <Typography>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No improvement areas identified yet
                </Typography>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                AI Hiring Recommendation
              </Typography>
              <Box sx={{ textAlign: "center", py: 4 }}>
                {hiringRecommendation ? (
                  <>
                    <Chip
                      label={hiringRecommendation.replace("_", " ")}
                      color={
                        hiringRecommendation.includes("HIRE") &&
                        !hiringRecommendation.includes("NO")
                          ? "success"
                          : "error"
                      }
                      sx={{ fontSize: 18, fontWeight: 700, py: 3, px: 4 }}
                    />
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      Based on technical proficiency, communication skills, and
                      overall performance
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    Complete interviews to receive AI hiring recommendations
                  </Typography>
                )}
              </Box>
              {radarData.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Score Breakdown
                  </Typography>
                  {radarData.map((item: any) => (
                    <Box key={item.subject} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2">{item.subject}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.score}/100
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.score}
                        sx={{
                          borderRadius: 4,
                          height: 6,
                          bgcolor: "rgba(124,77,255,0.1)",
                        }}
                      />
                    </Box>
                  ))}
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Recruiter/Admin view
  const stats = data?.stats || {
    totalInterviews: 0,
    completedInterviews: 0,
    hiredCount: 0,
    avgScore: 0,
  };
  const avgScores = data?.avgScores || {};
  const topCandidates = data?.topCandidates || [];

  const recruiterRadarData = [
    { subject: "Technical", score: avgScores.technical || 0 },
    { subject: "Communication", score: avgScores.communication || 0 },
    { subject: "Problem Solving", score: avgScores.problemSolving || 0 },
    { subject: "Code Quality", score: avgScores.codeQuality || 0 },
    { subject: "Confidence", score: avgScores.confidence || 0 },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Analytics & Reports
        </Typography>
        <Typography color="text.secondary">
          Recruitment performance insights
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Total Interviews",
            value: stats.totalInterviews,
            icon: <Assessment />,
            color: "#7C4DFF",
          },
          {
            title: "Completed",
            value: stats.completedInterviews,
            icon: <TrendingUp />,
            color: "#00C853",
          },
          {
            title: "Hired",
            value: stats.hiredCount,
            icon: <EmojiEvents />,
            color: "#FFB300",
          },
          {
            title: "Avg Score",
            value: stats.avgScore ? stats.avgScore.toFixed(1) : "N/A",
            icon: <Psychology />,
            color: "#00E5FF",
          },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, color: item.color }}
                >
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Average Candidate Scores
            </Typography>
            {recruiterRadarData.some((d) => d.score > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={recruiterRadarData}>
                  <PolarGrid stroke="rgba(124,77,255,0.2)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#B0BEC5", fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Avg Score"
                    dataKey="score"
                    stroke="#7C4DFF"
                    fill="rgba(124,77,255,0.3)"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  No scored interviews yet
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Top Candidates
            </Typography>
            {topCandidates.length > 0 ? (
              <Stack spacing={2}>
                {topCandidates.map((candidate: any, i: number) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "background.default",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {candidate.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.interviewTitle}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography color="primary" sx={{ fontWeight: 700 }}>
                        {candidate.overallScore}/100
                      </Typography>
                      {candidate.hiringRecommendation && (
                        <Chip
                          label={candidate.hiringRecommendation.replace(
                            "_",
                            " ",
                          )}
                          size="small"
                          color={
                            candidate.hiringRecommendation.includes("HIRE") &&
                            !candidate.hiringRecommendation.includes("NO")
                              ? "success"
                              : "default"
                          }
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  No candidate data yet
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
