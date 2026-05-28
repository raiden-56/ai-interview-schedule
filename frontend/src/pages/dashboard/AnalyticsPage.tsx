import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Stack,
  Divider,
  Button,
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

const radarData = [
  { subject: "Technical", score: 85 },
  { subject: "Communication", score: 78 },
  { subject: "Problem Solving", score: 90 },
  { subject: "Code Quality", score: 82 },
  { subject: "Confidence", score: 75 },
  { subject: "Creativity", score: 70 },
];

const performanceHistory = [
  { interview: "Int #1", score: 65 },
  { interview: "Int #2", score: 72 },
  { interview: "Int #3", score: 78 },
  { interview: "Int #4", score: 85 },
  { interview: "Int #5", score: 82 },
  { interview: "Int #6", score: 90 },
];

const strengths = [
  "Strong algorithmic thinking",
  "Clean code practices",
  "Good system design knowledge",
  "Effective communication",
];
const improvements = [
  "Edge case handling",
  "Time complexity optimization",
  "Deeper framework knowledge",
];

export default function AnalyticsPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Analytics & AI Reports
        </Typography>
        <Typography color="text.secondary">
          AI-powered insights from interview performance
        </Typography>
      </Box>

      {/* Score Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Overall Score",
            value: 85,
            icon: <Assessment />,
            color: "#7C4DFF",
          },
          {
            title: "Improvement",
            value: 23,
            icon: <TrendingUp />,
            color: "#00C853",
            suffix: "%",
          },
          {
            title: "Best Score",
            value: 92,
            icon: <EmojiEvents />,
            color: "#FFB300",
          },
          {
            title: "AI Confidence",
            value: 94,
            icon: <Psychology />,
            color: "#00E5FF",
            suffix: "%",
          },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: item.color }}
                >
                  {item.value}
                  {item.suffix || ""}
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
        {/* Radar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Skill Assessment
            </Typography>
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
          </Card>
        </Grid>

        {/* Performance History */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Performance Trend
            </Typography>
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
          </Card>
        </Grid>

        {/* AI Feedback */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Strengths Analysis
            </Typography>
            <Stack spacing={2}>
              {strengths.map((item, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Chip label="✓" size="small" color="success" />
                  <Typography>{item}</Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Areas for Improvement
            </Typography>
            <Stack spacing={2}>
              {improvements.map((item, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Chip label="!" size="small" color="warning" />
                  <Typography>{item}</Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Hiring Recommendation */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Hiring Recommendation
            </Typography>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Chip
                label="STRONG HIRE"
                color="success"
                sx={{ fontSize: 18, fontWeight: 700, py: 3, px: 4 }}
              />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Based on technical proficiency, communication skills, and
                overall performance
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Score Breakdown
            </Typography>
            {radarData.map((item) => (
              <Box key={item.subject} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2">{item.subject}</Typography>
                  <Typography variant="body2" fontWeight={600}>
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
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
