import {
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { proctoringAPI } from "../../services/api";
import {
  SEVERITY_COLORS,
  eventLabel,
  integrityColor,
} from "../../proctoring/labels";

interface ProctoringLog {
  id: string;
  eventType: string;
  severity: string;
  details?: string | null;
  metadata?: { preview?: string } | null;
  timestamp: string;
}

interface ProctoringReport {
  logs: ProctoringLog[];
  summary: {
    totalEvents: number;
    integrityScore: number;
    riskLevel: string;
    byType: Record<string, number>;
  };
}

/** Staff-only view of an interview's integrity score and flagged events. */
export default function ProctoringPanel({
  interviewId,
  live = false,
}: {
  interviewId: string;
  /** Poll as a fallback in case a socket alert is missed. */
  live?: boolean;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["proctoring", interviewId],
    queryFn: async () =>
      (await proctoringAPI.getReport(interviewId)).data
        .data as ProctoringReport,
    staleTime: 0,
    refetchInterval: live ? 30000 : false,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !data) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Could not load proctoring data.
      </Typography>
    );
  }

  const { summary, logs } = data;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: integrityColor(summary.integrityScore),
          }}
        >
          {summary.integrityScore}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Integrity score
          </Typography>
          <LinearProgress
            variant="determinate"
            value={summary.integrityScore}
            color={
              summary.integrityScore >= 85
                ? "success"
                : summary.integrityScore >= 60
                  ? "warning"
                  : "error"
            }
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
        <Chip
          size="small"
          label={`${summary.riskLevel} risk`}
          color={summary.riskLevel === "LOW" ? "success" : SEVERITY_COLORS[summary.riskLevel]}
        />
      </Stack>

      {Object.keys(summary.byType).length > 0 && (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mb: 1 }}>
          {Object.entries(summary.byType).map(([type, count]) => (
            <Chip
              key={type}
              size="small"
              variant="outlined"
              label={`${eventLabel(type)} × ${count}`}
            />
          ))}
        </Stack>
      )}

      {logs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No suspicious activity recorded.
        </Typography>
      ) : (
        <List dense disablePadding>
          {[...logs].reverse().map((log) => (
            <ListItem key={log.id} disableGutters divider>
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Chip
                      size="small"
                      label={log.severity}
                      color={SEVERITY_COLORS[log.severity] ?? "default"}
                      sx={{ height: 18, fontSize: 10 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {eventLabel(log.eventType)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(log.timestamp).format("HH:mm:ss")}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <>
                    {log.details}
                    {log.metadata?.preview && (
                      <Box
                        component="code"
                        sx={{
                          display: "block",
                          mt: 0.5,
                          p: 0.5,
                          fontSize: 11,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          bgcolor: "action.hover",
                          borderRadius: 1,
                        }}
                      >
                        {log.metadata.preview}
                      </Box>
                    )}
                  </>
                }
                slotProps={{ secondary: { component: "div" } }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
