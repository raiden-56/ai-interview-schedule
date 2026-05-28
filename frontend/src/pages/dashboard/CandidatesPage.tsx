import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  Stack,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Search,
  PersonAdd,
  Email,
  VideoCall,
  Refresh,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/useRedux";
import { userAPI, interviewAPI } from "../../services/api";

interface Candidate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function CandidatesPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule interview dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [interviewTitle, setInterviewTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getAll(page + 1, rowsPerPage, "CANDIDATE");
      setCandidates(res.data.data);
      setTotal(res.data.pagination?.total || res.data.data.length);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [page, rowsPerPage]);

  const filtered = candidates.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openInviteDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setInterviewTitle(
      `Interview with ${candidate.firstName} ${candidate.lastName}`,
    );
    setScheduledAt("");
    setDuration("60");
    setInviteMsg(null);
    setInviteOpen(true);
  };

  const handleScheduleInterview = async () => {
    if (!interviewTitle || !scheduledAt) {
      setInviteMsg({
        type: "error",
        text: "Title and scheduled date are required",
      });
      return;
    }
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const res = await interviewAPI.create({
        title: interviewTitle,
        candidateId: selectedCandidate!.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration: parseInt(duration, 10),
      });
      const meetingId = res.data?.data?.meetingId || res.data?.meetingId;
      setInviteMsg({
        type: "success",
        text: `Interview scheduled! Meeting ID: ${meetingId}`,
      });
    } catch (e: any) {
      setInviteMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to schedule interview",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Candidates
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage and schedule interviews with registered candidates
        </Typography>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={2}
              mb={3}
            >
              <TextField
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ maxWidth: 320 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Refresh">
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadCandidates}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Tooltip>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                            <Stack alignItems="center" spacing={1}>
                              <PersonAdd
                                sx={{ fontSize: 48, color: "text.disabled" }}
                              />
                              <Typography color="text.secondary">
                                No candidates found
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((candidate) => (
                          <TableRow key={candidate.id} hover>
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                              >
                                <Avatar
                                  src={candidate.avatar || undefined}
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: "primary.main",
                                    fontSize: 14,
                                  }}
                                >
                                  {candidate.firstName[0]}
                                  {candidate.lastName[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {candidate.firstName} {candidate.lastName}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <Email
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                                <Typography variant="body2">
                                  {candidate.email}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  candidate.isActive ? "Active" : "Inactive"
                                }
                                color={
                                  candidate.isActive ? "success" : "default"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {new Date(
                                  candidate.createdAt,
                                ).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<VideoCall />}
                                onClick={() => openInviteDialog(candidate)}
                              >
                                Schedule Interview
                              </Button>
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
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule Interview Dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Schedule Interview with {selectedCandidate?.firstName}{" "}
          {selectedCandidate?.lastName}
        </DialogTitle>
        <DialogContent>
          {inviteMsg && (
            <Alert severity={inviteMsg.type} sx={{ mb: 2, mt: 1 }}>
              {inviteMsg.text}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Interview Title"
              value={interviewTitle}
              onChange={(e) => setInterviewTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              fullWidth
              inputProps={{ min: 15, max: 180, step: 15 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleScheduleInterview}
            disabled={inviteLoading || inviteMsg?.type === "success"}
            startIcon={
              inviteLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <VideoCall />
              )
            }
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
