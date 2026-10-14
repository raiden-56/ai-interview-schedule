import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  IconButton,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  Code,
  Timer,
  Warning,
  Send,
  Fullscreen,
  Shield,
  CheckCircle,
} from "@mui/icons-material";
import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useWebRTC } from "../../hooks/useWebRTC";
import { useAntiCheating } from "../../hooks/useAntiCheating";
import { interviewAPI, codingAPI, aiAPI } from "../../services/api";
import { useAppSelector } from "../../hooks/useRedux";
import socketService from "../../sockets/socketService";
import ProctoringPanel from "../../components/interview/ProctoringPanel";
import { eventLabel } from "../../proctoring/labels";
import { runJavaScript } from "../../utils/runJavaScript";

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const defaultCode: Record<string, string> = {
  javascript:
    "// Write your solution here\nfunction solution(input) {\n  \n}\n\nconsole.log(solution());\n",
  typescript:
    "// Write your solution here\nfunction solution(input: any): any {\n  \n}\n",
  python: "# Write your solution here\ndef solution(input):\n    pass\n",
  java: "// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  cpp: "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  go: '// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n',
  rust: "// Write your solution here\nfn main() {\n    \n}\n",
};

const MONITORED_ITEMS = [
  "Your camera: face presence, additional people, looking away",
  "Leaving this tab or switching to another application",
  "Exiting fullscreen",
  "Copying and pasting from outside the interview",
  "Opening developer tools or using multiple displays",
];

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName?: string;
  timestamp?: string;
  createdAt?: string;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function InterviewRoom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.auth);

  const isPractice = !meetingId;
  const roomId = meetingId || `practice-${user?.id}`;
  const exitPath = isPractice ? "/dashboard" : "/dashboard/interviews";

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(!isPractice);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultCode.javascript);
  const [output, setOutput] = useState("");
  const [outputIsError, setOutputIsError] = useState(false);
  const [running, setRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sideTab, setSideTab] = useState<"chat" | "proctoring">("chat");
  const [unseenAlerts, setUnseenAlerts] = useState(0);
  const [codingSessionId, setCodingSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [practiceStartedAt, setPracticeStartedAt] = useState<number | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());
  const [joined, setJoined] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [report, setReport] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const codeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const autoSubmitted = useRef(false);

  const interviewId: string | null = interview?.id ?? null;
  const status: string = isPractice
    ? practiceStartedAt
      ? "IN_PROGRESS"
      : "SCHEDULED"
    : (interview?.status ?? "SCHEDULED");
  const isCandidateView =
    isPractice || (!!interview && interview.candidate?.id === user?.id);
  const isStaff = !isCandidateView;
  const isEnded = status === "COMPLETED" || status === "CANCELLED";
  const candidateActive =
    isCandidateView && sessionStarted && status === "IN_PROGRESS";

  const {
    localStream,
    localVideoRef,
    remoteVideoRef,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    mediaError,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    endCall,
  } = useWebRTC({ roomId, joined });

  const getEditorSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    return selection
      ? (editor?.getModel()?.getValueInRange(selection) ?? "")
      : "";
  }, []);

  const { violations, isFullscreen, enterFullscreen, faceMode, trackCodeInsertion } =
    useAntiCheating({
      interviewId: isPractice ? null : interviewId,
      enabled: candidateActive,
      videoStream: localStream,
      getEditorSelection,
    });

  // ---- Load interview -------------------------------------------------------
  useEffect(() => {
    if (!meetingId) return;
    let cancelled = false;
    const loadInterview = async () => {
      try {
        const res = await interviewAPI.getByMeetingId(meetingId);
        const data = res.data.data;
        if (cancelled) return;
        setInterview(data);
        setChatMessages(data.chatMessages ?? []);

        const session = data.codingSessions?.[0];
        if (session) {
          setCodingSessionId(session.id);
          if (session.language) setLanguage(session.language);
          if (session.code) setCode(session.code);
        } else if (data.status !== "COMPLETED" && data.status !== "CANCELLED") {
          const sessionRes = await codingAPI.createSession(
            data.id,
            "javascript",
          );
          if (!cancelled) setCodingSessionId(sessionRes.data.data.id);
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(
            err?.response?.data?.message || "Failed to load interview",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInterview();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // ---- Socket ---------------------------------------------------------------
  const ready = isPractice ? !!user : !!interviewId;
  useEffect(() => {
    if (!ready) return;
    const s = socketService.connect("/interview");
    let active = true;

    // (Re)join on every connect — the server forgets rooms on reconnect.
    const join = async () => {
      const res = await socketService.joinRoom(roomId);
      if (!active) return;
      setJoined(res.ok);
      if (!res.ok) console.error("Failed to join room:", res.error);
    };

    const onCodeUpdate = (data: { code: string; language?: string }) => {
      setCode(data.code);
      if (data.language) setLanguage(data.language);
    };
    const onNewMessage = (msg: ChatMessage) =>
      setChatMessages((prev) => [...prev, msg]);
    const onStatus = (data: {
      status: string;
      startedAt?: string;
      endedAt?: string;
    }) => setInterview((prev: any) => (prev ? { ...prev, ...data } : prev));
    const onCheating = (log: {
      eventType: string;
      severity: string;
      details?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["proctoring"] });
      setUnseenAlerts((n) => n + 1);
      enqueueSnackbar(
        `${eventLabel(log.eventType)} (${log.severity})${log.details ? ` — ${log.details}` : ""}`,
        {
          variant:
            log.severity === "HIGH" || log.severity === "CRITICAL"
              ? "error"
              : "warning",
        },
      );
    };

    if (s.connected) join();
    s.on("connect", join);
    s.on("code-update", onCodeUpdate);
    s.on("new-message", onNewMessage);
    s.on("interview-status", onStatus);
    s.on("cheating-detected", onCheating);

    return () => {
      active = false;
      s.off("connect", join);
      s.off("code-update", onCodeUpdate);
      s.off("new-message", onNewMessage);
      s.off("interview-status", onStatus);
      s.off("cheating-detected", onCheating);
      socketService.leaveRoom(roomId);
      socketService.disconnect();
      setJoined(false);
    };
  }, [ready, roomId, queryClient, enqueueSnackbar]);

  // ---- Timer ----------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const durationSec = (interview?.duration ?? 60) * 60;
  const startedAtMs = isPractice
    ? practiceStartedAt
    : interview?.startedAt
      ? new Date(interview.startedAt).getTime()
      : null;
  const remaining =
    status === "IN_PROGRESS" && startedAtMs
      ? Math.max(0, durationSec - Math.floor((now - startedAtMs) / 1000))
      : durationSec;

  // ---- Candidate feedback on violations --------------------------------------
  const seenViolations = useRef(0);
  useEffect(() => {
    const fresh = violations.slice(seenViolations.current);
    seenViolations.current = violations.length;
    fresh.forEach((v) =>
      enqueueSnackbar(
        `${eventLabel(v.eventType)} detected. ${isPractice ? "(practice — not recorded)" : "This has been recorded."}`,
        { variant: "warning" },
      ),
    );
  }, [violations, enqueueSnackbar, isPractice]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Turn the camera off once a candidate's interview is over.
  useEffect(() => {
    if (isEnded && isCandidateView) endCall();
  }, [isEnded, isCandidateView, endCall]);

  // ---- Code editing -----------------------------------------------------------
  const saveCode = useCallback(
    (nextCode: string, nextLanguage: string) => {
      if (codeTimeoutRef.current) clearTimeout(codeTimeoutRef.current);
      codeTimeoutRef.current = setTimeout(async () => {
        if (!codingSessionId) return;
        try {
          await codingAPI.updateCode(codingSessionId, nextCode, nextLanguage);
        } catch (err) {
          console.error("Failed to save code:", err);
        }
      }, 1500);
    },
    [codingSessionId],
  );

  const handleCodeChange: OnChange = (
    value,
    event,
  ) => {
    const newCode = value || "";
    setCode(newCode);

    if (event && !event.isFlush) {
      const inserted = Math.max(0, ...event.changes.map((c) => c.text.length));
      trackCodeInsertion(inserted);
    }

    socketService.sendCodeChange(roomId, newCode, language);
    saveCode(newCode, language);
  };

  const applyLanguage = (nextLanguage: string) => {
    const nextCode = defaultCode[nextLanguage] || "";
    setLanguage(nextLanguage);
    setCode(nextCode);
    socketService.sendCodeChange(roomId, nextCode, nextLanguage);
    saveCode(nextCode, nextLanguage);
  };

  const handleLanguageChange = (nextLanguage: string) => {
    const untouched = code === defaultCode[language] || !code.trim();
    if (untouched) return applyLanguage(nextLanguage);
    setConfirm({
      title: "Switch language?",
      message:
        "Switching language replaces your current code with a new template.",
      confirmLabel: "Switch",
      onConfirm: () => applyLanguage(nextLanguage),
    });
  };

  const handleRunCode = async () => {
    if (language !== "javascript") {
      setOutputIsError(false);
      setOutput(
        "In-browser execution supports JavaScript only. Use “AI Review” to get feedback on other languages.",
      );
      return;
    }
    setRunning(true);
    setOutput("Running...");
    const result = await runJavaScript(code);
    setRunning(false);
    setOutputIsError(!result.ok);
    setOutput(result.output || "(no output)");
    if (codingSessionId) {
      codingAPI.updateOutput(codingSessionId, result.output).catch(() => {});
    }
  };

  const handleAIReview = async () => {
    setRunning(true);
    setOutputIsError(false);
    setOutput("Analyzing code...");
    try {
      const result = await aiAPI.analyzeCode(code, language);
      const analysis = result.data.data;
      const section = (title: string, value: unknown) =>
        value
          ? `\n\n${title}:\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`
          : "";
      setOutput(
        analysis.raw
          ? String(analysis.raw)
          : `Code Quality Score: ${analysis.codeQualityScore ?? "N/A"}/100` +
              section("Bugs", analysis.bugs) +
              section("Optimizations", analysis.optimizations) +
              section("Complexity", analysis.complexity) +
              section("Best practices", analysis.bestPractices),
      );
    } catch (err: any) {
      setOutputIsError(true);
      setOutput(
        `Error: ${err?.response?.data?.message || err.message || "Failed to analyze code"}`,
      );
    } finally {
      setRunning(false);
    }
  };

  // ---- Lifecycle actions -------------------------------------------------------
  const handleStart = async () => {
    await enterFullscreen();
    if (isPractice) {
      setPracticeStartedAt(Date.now());
      setSessionStarted(true);
      return;
    }
    try {
      if (interview.status === "SCHEDULED") {
        const res = await interviewAPI.updateStatus(interview.id, "IN_PROGRESS");
        setInterview((prev: any) => ({ ...prev, ...res.data.data }));
      }
      setSessionStarted(true);
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || "Could not start the interview",
        { variant: "error" },
      );
    }
  };

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!interviewId || submitting) return;
      setSubmitting(true);
      try {
        if (codeTimeoutRef.current) clearTimeout(codeTimeoutRef.current);
        if (codingSessionId) {
          await codingAPI.updateCode(codingSessionId, code, language);
        }
        const res = await interviewAPI.updateStatus(interviewId, "COMPLETED");
        // Proctoring stops once status flips to COMPLETED; fullscreen is
        // exited from the end screen so it isn't flagged as a violation.
        setInterview((prev: any) => ({ ...prev, ...res.data.data }));
        enqueueSnackbar(
          auto ? "Time is up — your interview was submitted." : "Interview submitted.",
          { variant: "success" },
        );
      } catch (err: any) {
        enqueueSnackbar(
          err?.response?.data?.message || "Failed to submit. Please try again.",
          { variant: "error" },
        );
      } finally {
        setSubmitting(false);
      }
    },
    [interviewId, submitting, codingSessionId, code, language, enqueueSnackbar],
  );

  // Auto-submit when time runs out.
  useEffect(() => {
    if (
      !isPractice &&
      candidateActive &&
      remaining === 0 &&
      !autoSubmitted.current
    ) {
      autoSubmitted.current = true;
      handleSubmit(true);
    }
  }, [isPractice, candidateActive, remaining, handleSubmit]);

  const handleEndInterview = async () => {
    try {
      const res = await interviewAPI.updateStatus(interview.id, "COMPLETED");
      setInterview((prev: any) => ({ ...prev, ...res.data.data }));
      enqueueSnackbar("Interview ended", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to end interview", {
        variant: "error",
      });
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await aiAPI.generateReport(interview.id);
      setReport(res.data.data);
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || "AI report generation failed",
        { variant: "error" },
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const leave = () => {
    endCall();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate(exitPath);
  };

  const handleLeave = () => {
    if (candidateActive && !isPractice) {
      setConfirm({
        title: "Leave the interview?",
        message:
          "Leaving does not submit your work, and the timer keeps running. You can rejoin from your dashboard.",
        confirmLabel: "Leave",
        onConfirm: leave,
      });
    } else {
      leave();
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socketService.sendMessage(roomId, newMessage);
    setNewMessage("");
  };

  const senderName = (msg: ChatMessage) => {
    if (msg.senderName) return msg.senderName;
    if (msg.senderId === user?.id) return "You";
    const person =
      interview?.candidate?.id === msg.senderId
        ? interview.candidate
        : interview?.recruiter?.id === msg.senderId
          ? interview.recruiter
          : null;
    return person ? `${person.firstName} ${person.lastName}` : "Participant";
  };

  // ---- Render -------------------------------------------------------------------
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <CenteredCard>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Button variant="contained" onClick={() => navigate(exitPath)}>
          Back to dashboard
        </Button>
      </CenteredCard>
    );
  }

  if (isEnded && isCandidateView) {
    return (
      <CenteredCard>
        <CheckCircle color="success" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {status === "CANCELLED" ? "Interview cancelled" : "Interview submitted"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {status === "CANCELLED"
            ? "This interview was cancelled by the interviewer."
            : "Thank you! Your interviewer will review your session."}
        </Typography>
        <Button variant="contained" onClick={leave}>
          Back to dashboard
        </Button>
      </CenteredCard>
    );
  }

  const otherPartyLabel = isCandidateView
    ? "Interviewer"
    : interview?.candidate
      ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
      : "Candidate";
  const editorReadOnly = isCandidateView ? !candidateActive : isEnded;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
        userSelect: candidateActive ? "none" : undefined,
      }}
    >
      {/* Top Bar */}
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          borderRadius: 0,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Code sx={{ color: "primary.main" }} />
        <Typography sx={{ fontWeight: 600 }}>
          {isPractice ? "Practice Room" : interview?.title || "Interview Room"}
        </Typography>
        <Chip size="small" label={status.replace("_", " ")} variant="outlined" />
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Chip
          icon={<Timer />}
          label={formatTime(remaining)}
          color={status === "IN_PROGRESS" && remaining < 300 ? "error" : "default"}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        {isCandidateView && candidateActive && (
          <Tooltip
            title={
              faceMode === "face-detection"
                ? "Camera proctoring active"
                : faceMode === "loading"
                  ? "Loading camera proctoring..."
                  : "Face detection unavailable — basic camera checks only"
            }
          >
            <Chip
              icon={<Shield />}
              label="Proctored"
              size="small"
              color={faceMode === "face-detection" ? "success" : "default"}
              variant="outlined"
            />
          </Tooltip>
        )}
        {isCandidateView && violations.length > 0 && (
          <Chip
            icon={<Warning />}
            label={`${violations.length} warning${violations.length === 1 ? "" : "s"}`}
            color="error"
            size="small"
          />
        )}
        {isStaff && !isEnded && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() =>
              setConfirm({
                title: "End interview?",
                message:
                  "The candidate will no longer be able to edit their code.",
                confirmLabel: "End interview",
                onConfirm: handleEndInterview,
              })
            }
          >
            End interview
          </Button>
        )}
        {isStaff && (
          <Button
            size="small"
            variant="contained"
            onClick={handleGenerateReport}
            disabled={generatingReport}
          >
            {generatingReport ? "Generating..." : "AI report"}
          </Button>
        )}
        <Tooltip title="Fullscreen">
          <IconButton onClick={enterFullscreen}>
            <Fullscreen />
          </IconButton>
        </Tooltip>
      </Paper>

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Grid container sx={{ flex: 1, overflow: "hidden" }}>
          {/* Video Panel */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ p: 1 }}>
            <Stack spacing={1} sx={{ height: "100%" }}>
              {!isPractice && (
                <VideoTile
                  label={otherPartyLabel}
                  videoRef={remoteVideoRef}
                  placeholder={
                    remoteStream ? null : `Waiting for ${otherPartyLabel.toLowerCase()}...`
                  }
                />
              )}
              <VideoTile
                label="You"
                videoRef={localVideoRef}
                muted
                mirrored
                placeholder={mediaError}
              />
              {/* Video Controls */}
              <Paper
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  p: 1,
                }}
              >
                <Tooltip
                  title={
                    isCandidateView && candidateActive
                      ? "Turning off your camera is recorded"
                      : "Toggle camera"
                  }
                >
                  <IconButton
                    onClick={toggleVideo}
                    color={isVideoEnabled ? "default" : "error"}
                    size="small"
                  >
                    {isVideoEnabled ? <Videocam /> : <VideocamOff />}
                  </IconButton>
                </Tooltip>
                <IconButton
                  onClick={toggleAudio}
                  color={isAudioEnabled ? "default" : "error"}
                  size="small"
                >
                  {isAudioEnabled ? <Mic /> : <MicOff />}
                </IconButton>
                {!isPractice && (
                  <Tooltip title="Share screen">
                    <IconButton
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      color={isScreenSharing ? "primary" : "default"}
                      size="small"
                    >
                      {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Leave">
                  <IconButton color="error" size="small" onClick={handleLeave}>
                    <CallEnd />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Stack>
          </Grid>

          {/* Code Editor */}
          <Grid
            size={{ xs: 12, md: isPractice ? 9 : 6 }}
            sx={{ display: "flex", flexDirection: "column", p: 1 }}
          >
            {/* Editor Toolbar */}
            <Paper
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1,
                mb: 1,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  disabled={editorReadOnly}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                size="small"
                onClick={handleRunCode}
                disabled={running}
              >
                Run Code
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleAIReview}
                disabled={running}
              >
                AI Review
              </Button>
              {isCandidateView && !isPractice && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  disabled={submitting || !candidateActive}
                  onClick={() =>
                    setConfirm({
                      title: "Submit interview?",
                      message:
                        "You won't be able to change your code after submitting.",
                      confirmLabel: "Submit",
                      onConfirm: () => handleSubmit(),
                    })
                  }
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </Paper>

            {/* Monaco Editor */}
            <Box
              sx={{
                flex: 1,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(124,77,255,0.1)",
              }}
            >
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  padding: { top: 16 },
                  readOnly: editorReadOnly,
                  // Its Paste entry reads the clipboard API directly, bypassing
                  // paste-event monitoring.
                  contextmenu: false,
                }}
              />
            </Box>

            {/* Output Panel */}
            <Paper sx={{ mt: 1, p: 2, maxHeight: 180, overflow: "auto" }}>
              <Typography variant="subtitle2" gutterBottom>
                Output
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  m: 0,
                  color: outputIsError ? "error.main" : "success.main",
                }}
              >
                {output || "Run your code to see output here..."}
              </Typography>
            </Paper>
          </Grid>

          {/* Side Panel: chat (+ proctoring for staff) */}
          {!isPractice && (
            <Grid
              size={{ xs: 12, md: 3 }}
              sx={{ display: "flex", flexDirection: "column", p: 1 }}
            >
              <Card
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                {isStaff ? (
                  <Tabs
                    value={sideTab}
                    onChange={(_, v) => {
                      setSideTab(v);
                      if (v === "proctoring") setUnseenAlerts(0);
                    }}
                    variant="fullWidth"
                    sx={{ borderBottom: "1px solid rgba(124,77,255,0.1)" }}
                  >
                    <Tab value="chat" label="Chat" />
                    <Tab
                      value="proctoring"
                      label={
                        <Badge
                          color="error"
                          badgeContent={unseenAlerts}
                          sx={{ pr: unseenAlerts ? 1.5 : 0 }}
                        >
                          Proctoring
                        </Badge>
                      }
                    />
                  </Tabs>
                ) : (
                  <Box
                    sx={{ p: 2, borderBottom: "1px solid rgba(124,77,255,0.1)" }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>Chat</Typography>
                  </Box>
                )}

                {isStaff && sideTab === "proctoring" && interviewId ? (
                  <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                    <ProctoringPanel interviewId={interviewId} live={!isEnded} />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                      {chatMessages.map((msg) => {
                        const name = senderName(msg);
                        return (
                          <Box key={msg.id} sx={{ mb: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                                {name[0]}
                              </Avatar>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {msg.senderId === user?.id ? "You" : name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 3.5 }}>
                              {msg.message}
                            </Typography>
                          </Box>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        borderTop: "1px solid rgba(124,77,255,0.1)",
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={joined ? "Type a message..." : "Connecting..."}
                        disabled={!joined}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!joined}
                      >
                        <Send />
                      </IconButton>
                    </Box>
                  </>
                )}
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Candidate: consent + start gate */}
      {isCandidateView && !sessionStarted && !isEnded && (
        <Overlay>
          <Card sx={{ maxWidth: 560, p: 4 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <Shield color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {isPractice ? "Practice proctored session" : "This interview is proctored"}
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {isPractice
                ? "Try the same monitoring used in real interviews. Nothing is recorded in practice mode."
                : "The following activity is monitored and shared with your interviewer:"}
            </Typography>
            <List dense>
              {MONITORED_ITEMS.map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            {mediaError ? (
              <Alert severity="error" sx={{ my: 2 }}>
                {mediaError} A working camera is required.
              </Alert>
            ) : !localStream ? (
              <Alert severity="info" sx={{ my: 2 }}>
                Waiting for camera access...
              </Alert>
            ) : null}
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 2 }}>
              <Button onClick={() => navigate(exitPath)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={!localStream}
                onClick={handleStart}
                startIcon={<Fullscreen />}
              >
                {status === "IN_PROGRESS" && !isPractice
                  ? "Resume in fullscreen"
                  : "Start in fullscreen"}
              </Button>
            </Stack>
          </Card>
        </Overlay>
      )}

      {/* Candidate: must stay in fullscreen */}
      {candidateActive && !isFullscreen && (
        <Overlay>
          <Card sx={{ maxWidth: 480, p: 4, textAlign: "center" }}>
            <Warning color="error" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              You left fullscreen
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {isPractice
                ? "In a real interview this would be recorded."
                : "This has been recorded. Return to fullscreen to continue your interview."}
            </Typography>
            <Button variant="contained" onClick={enterFullscreen} startIcon={<Fullscreen />}>
              Return to fullscreen
            </Button>
          </Card>
        </Overlay>
      )}

      {/* Confirm dialog (MUI instead of window.confirm, which would trigger blur detection) */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              confirm?.onConfirm();
              setConfirm(null);
            }}
          >
            {confirm?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI report result (staff) */}
      <Dialog open={!!report} onClose={() => setReport(null)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Interview Report</DialogTitle>
        <DialogContent>
          {report && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                <Chip color="primary" label={`Overall ${Math.round(report.overallScore ?? 0)}`} />
                {report.hiringRecommendation && (
                  <Chip
                    color={report.hiringRecommendation.includes("NO") ? "error" : "success"}
                    label={report.hiringRecommendation.replace(/_/g, " ")}
                  />
                )}
              </Stack>
              <Typography variant="body2">{report.summary}</Typography>
              {report.weaknesses?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Concerns</Typography>
                  {report.weaknesses.map((w: string) => (
                    <Typography key={w} variant="body2" color="text.secondary">
                      • {w}
                    </Typography>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function VideoTile({
  label,
  videoRef,
  muted,
  mirrored,
  placeholder,
}: {
  label: string;
  videoRef: (el: HTMLVideoElement | null) => void;
  muted?: boolean;
  mirrored?: boolean;
  placeholder?: string | null;
}) {
  return (
    <Card
      sx={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        minHeight: 150,
        bgcolor: "#000",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: mirrored ? "scaleX(-1)" : undefined,
        }}
      />
      {placeholder && (
        <Typography
          variant="body2"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
            color: "grey.400",
          }}
        >
          {placeholder}
        </Typography>
      )}
      <Chip
        label={label}
        size="small"
        sx={{ position: "absolute", bottom: 8, left: 8 }}
      />
    </Card>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.85)",
        p: 2,
      }}
    >
      {children}
    </Box>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 480, textAlign: "center" }}>{children}</Card>
    </Box>
  );
}
