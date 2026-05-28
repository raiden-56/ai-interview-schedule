import { useState } from "react";
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
} from "@mui/material";
import {
  Add,
  Search,
  VideoCall,
  MoreVert,
  CalendarMonth,
} from "@mui/icons-material";
import { useAppSelector } from "../../hooks/useRedux";

const mockInterviews = [
  {
    id: "1",
    title: "Frontend Developer Interview",
    candidate: "John Doe",
    status: "SCHEDULED",
    scheduledAt: "2026-05-27T10:00:00",
    duration: 60,
    score: null,
  },
  {
    id: "2",
    title: "Backend Engineer Assessment",
    candidate: "Jane Smith",
    status: "COMPLETED",
    scheduledAt: "2026-05-25T14:00:00",
    duration: 45,
    score: 87,
  },
  {
    id: "3",
    title: "Full Stack Challenge",
    candidate: "Mike Johnson",
    status: "IN_PROGRESS",
    scheduledAt: "2026-05-26T09:00:00",
    duration: 90,
    score: null,
  },
  {
    id: "4",
    title: "DevOps Technical Round",
    candidate: "Sarah Wilson",
    status: "COMPLETED",
    scheduledAt: "2026-05-24T11:00:00",
    duration: 60,
    score: 92,
  },
  {
    id: "5",
    title: "React Developer Interview",
    candidate: "Tom Brown",
    status: "CANCELLED",
    scheduledAt: "2026-05-23T15:00:00",
    duration: 60,
    score: null,
  },
];

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
  const { user } = useAppSelector((state) => state.auth);

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  const filteredInterviews = mockInterviews.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.candidate.toLowerCase().includes(search.toLowerCase()),
  );

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
          <Typography variant="h4" fontWeight={700}>
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
          { label: "Total", value: 156, color: "#7C4DFF" },
          { label: "Scheduled", value: 23, color: "#00E5FF" },
          { label: "Completed", value: 120, color: "#00C853" },
          { label: "This Week", value: 8, color: "#FFB300" },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: stat.color }}
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, maxWidth: 400 }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Interview</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInterviews
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((interview) => (
                    <TableRow key={interview.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {interview.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {interview.candidate[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {interview.candidate}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interview.status}
                          size="small"
                          color={statusColors[interview.status]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>{interview.duration} min</TableCell>
                      <TableCell>
                        {interview.score ? (
                          <Chip
                            label={`${interview.score}%`}
                            size="small"
                            color={interview.score > 80 ? "success" : "warning"}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {interview.status === "SCHEDULED" && (
                          <Button
                            size="small"
                            startIcon={<VideoCall />}
                            variant="outlined"
                          >
                            Join
                          </Button>
                        )}
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredInterviews.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
          />
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
            <TextField fullWidth label="Interview Title" />
            <TextField fullWidth label="Candidate Email" type="email" />
            <TextField fullWidth label="Job Position" />
            <TextField
              fullWidth
              label="Scheduled Date & Time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              defaultValue={60}
              select
            >
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
              <MenuItem value={90}>90 minutes</MenuItem>
              <MenuItem value={120}>120 minutes</MenuItem>
            </TextField>
            <TextField fullWidth label="Description" multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CalendarMonth />}
            onClick={() => setOpenDialog(false)}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
