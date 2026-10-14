import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp,
  People,
  VideoCall,
  Assessment,
  Schedule,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAppSelector } from "../../hooks/useRedux";
import { analyticsAPI } from "../../services/api";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#00C853",
  SCHEDULED: "#7C4DFF",
  IN_PROGRESS: "#00E5FF",
  CANCELLED: "#FF5252",
};

export default function DashboardHome() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsAPI.getDashboardStats();
        setDashboardData(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const stats = dashboardData?.stats || {
    totalInterviews: 0,
    totalCandidates: 0,
    avgScore: 0,
    scheduledInterviews: 0,
  };

  const statsCards = [
    {
      title: "Total Interviews",
      value: String(stats.totalInterviews),
      icon: <VideoCall />,
      color: "#7C4DFF",
    },
    {
      title: "Candidates",
      value: String(stats.totalCandidates),
      icon: <People />,
      color: "#00E5FF",
    },
    {
      title: "Avg. Score",
      value: stats.avgScore ? stats.avgScore.toFixed(1) : "N/A",
      icon: <Assessment />,
      color: "#00C853",
    },
    {
      title: "Scheduled",
      value: String(stats.scheduledInterviews),
      icon: <Schedule />,
      color: "#FFB300",
    },
  ];

  const chartData = dashboardData?.chartData || [];
  const statusDistribution = (dashboardData?.statusDistribution || []).map(
    (s: any) => ({
      ...s,
      color: STATUS_COLORS[s.name] || "#999",
    }),
  );
  const recentInterviews = dashboardData?.recentInterviews || [];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Here's what's happening with your interviews today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${stat.color}20`,
                      }}
                    >
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Interview Activity
            </Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="date" stroke="#B0BEC5" />
                  <YAxis stroke="#B0BEC5" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121A2B",
                      border: "1px solid rgba(124,77,255,0.2)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="interviews"
                    stroke="#7C4DFF"
                    fill="rgba(124,77,255,0.2)"
                  />
                </AreaChart>
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
                  No interview activity this week
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Interview Status
            </Typography>
            {statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={1}>
                  {statusDistribution.map((item: any) => (
                    <Box
                      key={item.name}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            ) : (
              <Box
                sx={{
                  height: 240,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">No data yet</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Recent Interviews */}
      <Card sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Interviews
          </Typography>
          <Button variant="text" size="small" href="/dashboard/interviews">
            View All
          </Button>
        </Box>
        {recentInterviews.length > 0 ? (
          <Stack spacing={2}>
            {recentInterviews.map((interview: any, index: number) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {interview.name?.[0] || "?"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {interview.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {interview.title}
                  </Typography>
                </Box>
                {interview.score > 0 && (
                  <Box sx={{ width: 100 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption">Score</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {interview.score}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={interview.score}
                      sx={{
                        borderRadius: 4,
                        bgcolor: "rgba(124,77,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: interview.score > 80 ? "#00C853" : "#FFB300",
                        },
                      }}
                    />
                  </Box>
                )}
                <Chip
                  label={interview.status}
                  size="small"
                  color={
                    interview.status === "COMPLETED" ? "success" : "primary"
                  }
                  variant="outlined"
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              No interviews yet. Schedule your first interview to get started!
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
