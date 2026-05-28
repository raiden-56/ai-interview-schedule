import { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  Chat,
  Code,
  Timer,
  Warning,
  Send,
  Fullscreen,
} from "@mui/icons-material";
import Editor from "@monaco-editor/react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { useAntiCheating } from "../../hooks/useAntiCheating";

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
    "// Write your solution here\nfunction solution(input) {\n  \n}\n",
  typescript:
    "// Write your solution here\nfunction solution(input: any): any {\n  \n}\n",
  python: "# Write your solution here\ndef solution(input):\n    pass\n",
  java: "// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  cpp: "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  go: '// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n',
  rust: "// Write your solution here\nfn main() {\n    \n}\n",
};

export default function InterviewRoom() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultCode.javascript);
  const [output, setOutput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [timer, setTimer] = useState(3600); // 60 minutes
  const chatEndRef = useRef<HTMLDivElement>(null);

  const roomId = "demo-room";
  const userId = "demo-user";

  const {
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    initializeMedia,
  } = useWebRTC({ roomId, userId });

  const { violations } = useAntiCheating({ roomId, enabled: true });

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleRunCode = () => {
    setOutput("Running code...\n\n> Output will appear here after execution.");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { text: newMessage, sender: "You", time: new Date() },
    ]);
    setNewMessage("");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
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
        }}
      >
        <Code sx={{ color: "primary.main" }} />
        <Typography fontWeight={600}>Interview Room</Typography>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Chip
          icon={<Timer />}
          label={formatTime(timer)}
          color={timer < 300 ? "error" : "default"}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        {violations.length > 0 && (
          <Chip
            icon={<Warning />}
            label={`${violations.length} warnings`}
            color="error"
            size="small"
          />
        )}
        <Tooltip title="Toggle Chat">
          <IconButton onClick={() => setShowChat(!showChat)}>
            <Chat color={showChat ? "primary" : "inherit"} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fullscreen">
          <IconButton
            onClick={() => document.documentElement.requestFullscreen()}
          >
            <Fullscreen />
          </IconButton>
        </Tooltip>
      </Paper>

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Grid container sx={{ flex: 1, overflow: "hidden" }}>
            {/* Video Panel */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ p: 1 }}>
              <Stack spacing={1} sx={{ height: "100%" }}>
                <Card
                  sx={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    minHeight: 150,
                  }}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Chip
                    label="Interviewer"
                    size="small"
                    sx={{ position: "absolute", bottom: 8, left: 8 }}
                  />
                </Card>
                <Card
                  sx={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    minHeight: 150,
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Chip
                    label="You"
                    size="small"
                    sx={{ position: "absolute", bottom: 8, left: 8 }}
                  />
                </Card>
                {/* Video Controls */}
                <Paper
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                    p: 1,
                  }}
                >
                  <IconButton
                    onClick={toggleVideo}
                    color={isVideoEnabled ? "default" : "error"}
                    size="small"
                  >
                    {isVideoEnabled ? <Videocam /> : <VideocamOff />}
                  </IconButton>
                  <IconButton
                    onClick={toggleAudio}
                    color={isAudioEnabled ? "default" : "error"}
                    size="small"
                  >
                    {isAudioEnabled ? <Mic /> : <MicOff />}
                  </IconButton>
                  <IconButton
                    onClick={
                      isScreenSharing ? stopScreenShare : startScreenShare
                    }
                    color={isScreenSharing ? "primary" : "default"}
                    size="small"
                  >
                    {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
                  </IconButton>
                  <IconButton color="error" size="small">
                    <CallEnd />
                  </IconButton>
                </Paper>
              </Stack>
            </Grid>

            {/* Code Editor */}
            <Grid
              size={{ xs: 12, md: showChat ? 6 : 9 }}
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
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(defaultCode[e.target.value] || "");
                    }}
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
                >
                  Run Code
                </Button>
                <Button variant="outlined" size="small" color="success">
                  Submit
                </Button>
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
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    padding: { top: 16 },
                  }}
                />
              </Box>

              {/* Output Panel */}
              <Paper sx={{ mt: 1, p: 2, maxHeight: 150, overflow: "auto" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Output
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    color: output.includes("Error")
                      ? "error.main"
                      : "success.main",
                  }}
                >
                  {output || "Run your code to see output here..."}
                </Typography>
              </Paper>
            </Grid>

            {/* Chat Panel */}
            {showChat && (
              <Grid
                size={{ xs: 12, md: 3 }}
                sx={{ display: "flex", flexDirection: "column", p: 1 }}
              >
                <Card
                  sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: "1px solid rgba(124,77,255,0.1)",
                    }}
                  >
                    <Typography fontWeight={600}>Chat</Typography>
                  </Box>
                  <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                    {chatMessages.map((msg, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                            {msg.sender[0]}
                          </Avatar>
                          <Typography variant="caption" fontWeight={600}>
                            {msg.sender}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ pl: 3.5 }}>
                          {msg.text}
                        </Typography>
                      </Box>
                    ))}
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
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <IconButton color="primary" onClick={handleSendMessage}>
                      <Send />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
