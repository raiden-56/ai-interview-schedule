export const EVENT_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab switch",
  BROWSER_BLUR: "Window lost focus",
  COPY_PASTE: "Copy / cut",
  EXTERNAL_PASTE: "External paste",
  FULLSCREEN_EXIT: "Exited fullscreen",
  KEYBOARD_INACTIVITY: "Inactivity",
  MULTIPLE_FACES: "Multiple faces",
  NO_FACE: "Face not visible",
  EYE_MOVEMENT: "Looking away",
  CAMERA_OFF: "Camera off / covered",
  DEVTOOLS_OPEN: "DevTools attempt",
  MULTIPLE_SCREENS: "Multiple displays",
};

export const SEVERITY_COLORS: Record<
  string,
  "default" | "info" | "warning" | "error" | "secondary"
> = {
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "error",
  CRITICAL: "error",
  PRACTICE: "secondary",
};

export const eventLabel = (type: string) => EVENT_LABELS[type] ?? type;

export const integrityColor = (score: number) =>
  score >= 85 ? "success.main" : score >= 60 ? "warning.main" : "error.main";
