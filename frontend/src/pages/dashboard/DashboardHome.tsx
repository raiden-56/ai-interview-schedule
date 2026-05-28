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
} from "@mui/material";
import {
  TrendingUp,
  People,
  VideoCall,
  Assessment,
  Schedule,
  Code,
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

const chartData = [
  { name: "Mon", interviews: 4, candidates: 12 },
  { name: "Tue", interviews: 6, candidates: 8 },
  { name: "Wed", interviews: 8, candidates: 15 },
  { name: "Thu", interviews: 3, candidates: 10 },
  { name: "Fri", interviews: 7, candidates: 18 },
  { name: "Sat", interviews: 2, candidates: 5 },
  { name: "Sun", interviews: 1, candidates: 3 },
];

const pieData = [
  { name: "Completed", value: 45, color: "#00C853" },
  { name: "Scheduled", value: 30, color: "#7C4DFF" },
  { name: "In Progress", value: 15, color: "#00E5FF" },
  { name: "Cancelled", value: 10, color: "#FF5252" },
];

const recentInterviews = [
  {
    name: "John Doe",
    role: "Sr. Frontend Dev",
    score: 87,
    status: "completed",
  },
  {
    name: "Jane Smith",
    role: "Backend Engineer",
    score: 92,
    status: "completed",
  },
  {
    name: "Mike Johnson",
    role: "Full Stack Dev",
    score: 0,
    status: "scheduled",
  },
  {
    name: "Sarah Wilson",
    role: "DevOps Engineer",
    score: 78,
    status: "completed",
  },
];

const statsCards = [
  {
    title: "Total Interviews",
    value: "156",
    change: "+12%",
    icon: <VideoCall />,
    color: "#7C4DFF",
  },
  {
    title: "Candidates",
    value: "89",
    change: "+8%",
    icon: <People />,
    color: "#00E5FF",
  },
  {
    title: "Avg. Score",
    value: "82.5",
    change: "+5%",
    icon: <Assessment />,
    color: "#00C853",
  },
  {
    title: "Scheduled",
    value: "23",
    change: "+3",
    icon: <Schedule />,
    color: "#FFB300",
  },
];

export default function DashboardHome() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
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
                      <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                        {stat.value}
                      </Typography>
                      <Chip
                        label={stat.change}
                        size="small"
                        icon={<TrendingUp sx={{ fontSize: 16 }} />}
                        color="success"
                        variant="outlined"
                      />
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Interview Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="name" stroke="#B0BEC5" />
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
                <Area
                  type="monotone"
                  dataKey="candidates"
                  stroke="#00E5FF"
                  fill="rgba(0,229,255,0.1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Interview Status
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Stack spacing={1}>
              {pieData.map((item) => (
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
                  <Typography variant="body2" fontWeight={600}>
                    {item.value}%
                  </Typography>
                </Box>
              ))}
            </Stack>
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
          <Typography variant="h6" fontWeight={600}>
            Recent Interviews
          </Typography>
          <Button variant="text" size="small">
            View All
          </Button>
        </Box>
        <Stack spacing={2}>
          {recentInterviews.map((interview, index) => (
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
                {interview.name[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{interview.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {interview.role}
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
                    <Typography variant="caption" fontWeight={600}>
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
                color={interview.status === "completed" ? "success" : "primary"}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
