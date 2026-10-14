import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code,
  VideoCall,
  Psychology,
  Security,
  Speed,
  Assessment,
} from "@mui/icons-material";

const features = [
  {
    icon: <Code fontSize="large" />,
    title: "Live Coding Editor",
    desc: "Monaco-powered editor with multi-language support and real-time collaboration",
  },
  {
    icon: <VideoCall fontSize="large" />,
    title: "Video Interviews",
    desc: "WebRTC-powered video calls with screen sharing and recording",
  },
  {
    icon: <Psychology fontSize="large" />,
    title: "AI Analysis",
    desc: "AI-powered interview analysis with confidence and communication scoring",
  },
  {
    icon: <Security fontSize="large" />,
    title: "Anti-Cheating",
    desc: "Advanced proctoring with tab detection, face tracking, and eye monitoring",
  },
  {
    icon: <Speed fontSize="large" />,
    title: "Real-time Collaboration",
    desc: "Socket.IO powered real-time code editing and instant communication",
  },
  {
    icon: <Assessment fontSize="large" />,
    title: "Smart Analytics",
    desc: "Comprehensive reports with candidate ranking and hiring recommendations",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "VP Engineering, TechCorp",
    text: "InterviewAI reduced our hiring time by 60% while improving candidate quality.",
  },
  {
    name: "Michael Chen",
    role: "CTO, StartupXYZ",
    text: "The AI feedback and anti-cheating features give us confidence in remote assessments.",
  },
  {
    name: "Emily Davis",
    role: "HR Director, GlobalTech",
    text: "Best interview platform we have used. The analytics are game-changing.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 10, md: 16 },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Stack
              spacing={4}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Chip
                label="🚀 AI-Powered Interview Platform"
                color="primary"
                variant="outlined"
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  maxWidth: 800,
                  background: "linear-gradient(135deg, #7C4DFF, #00E5FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Hire Top Talent with AI-Powered Interviews
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600 }}
              >
                The all-in-one platform for live coding interviews, video
                assessments, and AI-driven candidate evaluation.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/register")}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </Stack>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          sx={{ textAlign: "center", fontWeight: 700 }}
          gutterBottom
        >
          Everything You Need
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 6, maxWidth: 600, mx: "auto" }}
        >
          A complete platform to conduct, analyze, and optimize your technical
          interviews
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  sx={{
                    height: "100%",
                    p: 2,
                    "&:hover": {
                      borderColor: "primary.main",
                      transform: "translateY(-4px)",
                      transition: "all 0.3s",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600 }}
                      gutterBottom
                    >
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials */}
      <Box sx={{ bgcolor: "background.paper", py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{ textAlign: "center", fontWeight: 700 }}
            gutterBottom
          >
            Trusted by Top Teams
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {testimonials.map((item, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card sx={{ height: "100%", p: 3 }}>
                  <CardContent>
                    <Typography
                      color="text.secondary"
                      sx={{ mb: 3, fontStyle: "italic" }}
                    >
                      "{item.text}"
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {item.name[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.role}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }} gutterBottom>
          Ready to Transform Your Hiring?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Start conducting AI-powered interviews today. No credit card required.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/register")}
        >
          Start Free Trial
        </Button>
      </Container>
    </Box>
  );
}
