import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Stack,
  InputAdornment,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Search,
  VideoCall,
  CalendarMonth,
  Shield,
  Visibility,
} from "@mui/icons-material";
import { useAppSelector } from "../../hooks/useRedux";
import { interviewAPI, userAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import ProctoringPanel from "../../components/interview/ProctoringPanel";

const statusColors: Record<
  string,
  "success" | "primary" | "warning" | "error"
> = {
  COMPLETED: "success",
  SCHEDULED: "primary",
  IN_PROGRESS: "warning",
  CANCELLED: "error",
};

export default function InterviewsPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    candidateEmail: "",
    scheduledAt: "",
    duration: 60,
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [proctoringFor, setProctoringFor] = useState<any>(null);
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      let res;
      if (isRecruiter) {
        res = await interviewAPI.getRecruiterInterviews(page + 1, rowsPerPage);
      } else {
        res = await interviewAPI.getCandidateInterviews(page + 1, rowsPerPage);
      }
      setInterviews(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [page, rowsPerPage]);

  const handleCreateInterview = async () => {
    setFormError("");
    if (!formData.title || !formData.candidateEmail || !formData.scheduledAt) {
      setFormError("Please fill in all required fields");
      return;
    }
    setFormLoading(true);
    try {
      // Look up the candidate by email (server-side search)
      const email = formData.candidateEmail.trim().toLowerCase();
      const usersRes = await userAPI.getAll(1, 10, "CANDIDATE", email);
      const candidate = (usersRes.data.data || []).find(
        (c: any) => c.email.toLowerCase() === email,
      );

      if (!candidate) {
        setFormError(
          "Candidate with this email not found. Please ensure they are registered.",
        );
        setFormLoading(false);
        return;
      }

      await interviewAPI.create({
        title: formData.title,
        description: formData.description,
        candidateId: candidate.id,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: formData.duration,
      });

      setOpenDialog(false);
      setFormData({
        title: "",
        candidateEmail: "",
        scheduledAt: "",
        duration: 60,
        description: "",
      });
      fetchInterviews();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || "Failed to schedule interview",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(
    (i) =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      `${i.candidate?.firstName} ${i.candidate?.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const stats = {
    total,
    scheduled: interviews.filter((i) => i.status === "SCHEDULED").length,
    completed: interviews.filter((i) => i.status === "COMPLETED").length,
    inProgress: interviews.filter((i) => i.status === "IN_PROGRESS").length,
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Interviews
          </Typography>
          <Typography color="text.secondary">
            Manage and track all interviews
          </Typography>
        </Box>
        {isRecruiter && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Schedule Interview
          </Button>
        )}
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total", value: stats.total, color: "#7C4DFF" },
          { label: "Scheduled", value: stats.scheduled, color: "#00E5FF" },
          { label: "Completed", value: stats.completed, color: "#00C853" },
          { label: "In Progress", value: stats.inProgress, color: "#FFB300" },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: stat.color }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              size="small"
              placeholder="Search interviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, maxWidth: 400 }}
            />
          </Box>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Interview</TableCell>
                      <TableCell>
                        {isRecruiter ? "Candidate" : "Company"}
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Scheduled</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInterviews.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{ textAlign: "center", py: 4 }}
                        >
                          <Typography color="text.secondary">
                            No interviews found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInterviews.map((interview) => (
                        <TableRow key={interview.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }}>
                              {interview.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center" }}
                            >
                              <Avatar
                                sx={{ width: 28, height: 28, fontSize: 12 }}
                              >
                                {isRecruiter
                                  ? interview.candidate?.firstName?.[0] || "?"
                                  : interview.company?.name?.[0] || "?"}
                              </Avatar>
                              <Typography variant="body2">
                                {isRecruiter
                                  ? `${interview.candidate?.firstName || ""} ${interview.candidate?.lastName || ""}`
                                  : interview.company?.name || ""}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={interview.status}
                              size="small"
                              color={
                                statusColors[interview.status] || "default"
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(
                                interview.scheduledAt,
                              ).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{interview.duration} min</TableCell>
                          <TableCell>
                            {interview.aiReports?.[0]?.overallScore ? (
                              <Chip
                                label={`${Math.round(interview.aiReports[0].overallScore)}%`}
                                size="small"
                                color={
                                  interview.aiReports[0].overallScore > 80
                                    ? "success"
                                    : "warning"
                                }
                              />
                            ) : interview.avgScore ? (
                              <Chip
                                label={`${Math.round(interview.avgScore)}%`}
                                size="small"
                                color={
                                  interview.avgScore > 80
                                    ? "success"
                                    : "warning"
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center" }}
                            >
                              {interview.status === "SCHEDULED" ||
                              interview.status === "IN_PROGRESS" ? (
                                <Button
                                  size="small"
                                  startIcon={<VideoCall />}
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(`/interview/${interview.meetingId}`)
                                  }
                                >
                                  Join
                                </Button>
                              ) : (
                                isRecruiter && (
                                  <Button
                                    size="small"
                                    startIcon={<Visibility />}
                                    onClick={() =>
                                      navigate(
                                        `/interview/${interview.meetingId}`,
                                      )
                                    }
                                  >
                                    Review
                                  </Button>
                                )
                              )}
                              {isRecruiter && (
                                <Tooltip title="Proctoring report">
                                  <IconButton
                                    size="small"
                                    onClick={() => setProctoringFor(interview)}
                                  >
                                    <Badge
                                      color="error"
                                      badgeContent={
                                        interview._count?.cheatingLogs || 0
                                      }
                                      max={99}
                                    >
                                      <Shield fontSize="small" />
                                    </Badge>
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) =>
                  setRowsPerPage(parseInt(e.target.value, 10))
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Interview Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule New Interview</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              fullWidth
              label="Interview Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Candidate Email"
              type="email"
              value={formData.candidateEmail}
              onChange={(e) =>
                setFormData({ ...formData, candidateEmail: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Scheduled Date & Time"
              type="datetime-local"
              slotProps={{ inputLabel: { shrink: true } }}
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Duration (minutes)"
              select
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value, 10),
                })
              }
            >
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
              <MenuItem value={90}>90 minutes</MenuItem>
              <MenuItem value={120}>120 minutes</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CalendarMonth />}
            onClick={handleCreateInterview}
            disabled={formLoading}
          >
            {formLoading ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!proctoringFor}
        onClose={() => setProctoringFor(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Proctoring report
          {proctoringFor && (
            <Typography variant="body2" color="text.secondary">
              {proctoringFor.title} —{" "}
              {proctoringFor.candidate?.firstName}{" "}
              {proctoringFor.candidate?.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {proctoringFor && <ProctoringPanel interviewId={proctoringFor.id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProctoringFor(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
