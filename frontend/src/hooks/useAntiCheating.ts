import { useCallback, useEffect, useRef, useState } from "react";
import { proctoringAPI } from "../services/api";
import { FaceMonitor, type FaceMonitorMode } from "../proctoring/faceMonitor";

export type ViolationType =
  | "TAB_SWITCH"
  | "BROWSER_BLUR"
  | "COPY_PASTE"
  | "EXTERNAL_PASTE"
  | "FULLSCREEN_EXIT"
  | "KEYBOARD_INACTIVITY"
  | "MULTIPLE_FACES"
  | "NO_FACE"
  | "EYE_MOVEMENT"
  | "CAMERA_OFF"
  | "DEVTOOLS_OPEN"
  | "MULTIPLE_SCREENS";

export interface Violation {
  id: string;
  eventType: ViolationType;
  details: string;
  severity?: string;
  timestamp: Date;
}

interface UseAntiCheatingOptions {
  /** Interview to report to. null = practice mode: detect locally only. */
  interviewId: string | null;
  /** Only true for the candidate while the interview is running. */
  enabled: boolean;
  /** Candidate's camera stream, used for face / camera checks. */
  videoStream: MediaStream | null;
  /** Returns text currently selected in the code editor (for copy tracking). */
  getEditorSelection?: () => string;
}

interface QueuedEvent {
  eventType: ViolationType;
  details: string;
  metadata?: Record<string, unknown>;
  localId: string;
}

const THROTTLE_MS = 2000;
const INACTIVITY_MS = 3 * 60 * 1000;
const FACE_CHECK_MS = 1000;
// Consecutive face checks (1/s) before an episode is reported.
const NO_FACE_CHECKS = 4;
const MULTI_FACE_CHECKS = 2;
const LOOK_AWAY_CHECKS = 5;
const DARK_CHECKS = 3;
// Inserting this many characters in one edit without a paste event suggests
// an auto-typer or a script injecting code.
const LARGE_INSERT_CHARS = 120;

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

export const useAntiCheating = ({
  interviewId,
  enabled,
  videoStream,
  getEditorSelection,
}: UseAntiCheatingOptions) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(
    () => !!document.fullscreenElement,
  );
  const [monitorMode, setMonitorMode] = useState<FaceMonitorMode>("loading");

  const lastSent = useRef<Partial<Record<ViolationType, number>>>({});
  const queue = useRef<QueuedEvent[]>([]);
  const internalCopies = useRef<string[]>([]);
  const lastPasteAt = useRef(0);
  const getSelectionRef = useRef(getEditorSelection);
  useEffect(() => {
    getSelectionRef.current = getEditorSelection;
  }, [getEditorSelection]);

  const send = useCallback(
    async (event: QueuedEvent) => {
      if (!interviewId) return;
      try {
        const res = await proctoringAPI.reportEvent(interviewId, {
          eventType: event.eventType,
          details: event.details,
          metadata: event.metadata,
        });
        const severity = res.data?.data?.severity;
        if (severity) {
          setViolations((prev) =>
            prev.map((v) => (v.id === event.localId ? { ...v, severity } : v)),
          );
        }
      } catch (error: any) {
        const status = error?.response?.status;
        // Retry network/server failures; client errors (e.g. interview ended) are final.
        if (!status || status >= 500) queue.current.push(event);
      }
    },
    [interviewId],
  );

  const reportViolation = useCallback(
    (
      eventType: ViolationType,
      details: string,
      metadata?: Record<string, unknown>,
    ) => {
      const now = Date.now();
      if (now - (lastSent.current[eventType] ?? 0) < THROTTLE_MS) return;
      lastSent.current[eventType] = now;

      const localId = `${eventType}-${now}`;
      setViolations((prev) => [
        ...prev,
        {
          id: localId,
          eventType,
          details,
          severity: interviewId ? undefined : "PRACTICE",
          timestamp: new Date(now),
        },
      ]);
      send({ eventType, details, metadata, localId });
    },
    [interviewId, send],
  );

  // Retry events that failed to send (offline, server restart, ...).
  useEffect(() => {
    if (!enabled || !interviewId) return;
    const flush = () => {
      const pending = queue.current.splice(0);
      pending.forEach((event) => send(event));
    };
    const timer = setInterval(flush, 10000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", flush);
    };
  }, [enabled, interviewId, send]);

  // Browser / keyboard / clipboard signals
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation("TAB_SWITCH", "Left the interview tab");
      }
    };

    // Window lost focus while the tab is still visible: another app or a
    // second monitor got focus. Tab switches are covered above.
    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const handleBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hidden && !document.hasFocus()) {
          reportViolation(
            "BROWSER_BLUR",
            "Interview window lost focus (another application was used)",
          );
        }
      }, 300);
    };

    const rememberCopy = (text: string) => {
      const value = normalize(text);
      if (!value) return;
      internalCopies.current = [value, ...internalCopies.current].slice(0, 20);
    };

    const handleCopy = (e: ClipboardEvent) => {
      const text =
        window.getSelection()?.toString() || getSelectionRef.current?.() || "";
      rememberCopy(text);
      if (text.length > 0) {
        reportViolation(
          "COPY_PASTE",
          `${e.type === "cut" ? "Cut" : "Copied"} ${text.length} characters`,
          { action: e.type, length: text.length },
        );
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      lastPasteAt.current = Date.now();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text.trim()) return;
      // Pasting something copied inside the interview itself is fine.
      if (internalCopies.current.includes(normalize(text))) return;
      reportViolation(
        "EXTERNAL_PASTE",
        `Pasted ${text.length} characters from outside the interview`,
        {
          length: text.length,
          lines: text.split("\n").length,
          preview: text.slice(0, 120),
        },
      );
    };

    const handleDrop = (e: DragEvent) => {
      const text = e.dataTransfer?.getData("text/plain") ?? "";
      if (!text.trim()) return;
      lastPasteAt.current = Date.now();
      reportViolation(
        "EXTERNAL_PASTE",
        `Dropped ${text.length} characters into the page`,
        { length: text.length, preview: text.slice(0, 120), via: "drop" },
      );
    };

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) reportViolation("FULLSCREEN_EXIT", "Exited fullscreen mode");
    };

    let lastActivity = Date.now();
    let idleReported = false;
    const markActive = () => {
      lastActivity = Date.now();
      idleReported = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      markActive();
      const key = e.key.toUpperCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools =
        key === "F12" ||
        (mod && (e.shiftKey || e.altKey) && ["I", "J", "C"].includes(key)) ||
        (mod && key === "U");
      if (devtools) {
        e.preventDefault();
        reportViolation(
          "DEVTOOLS_OPEN",
          `Attempted to open developer tools (${e.key})`,
        );
      }
    };

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    const inactivityTimer = setInterval(() => {
      if (
        !idleReported &&
        !document.hidden &&
        Date.now() - lastActivity > INACTIVITY_MS
      ) {
        idleReported = true;
        reportViolation(
          "KEYBOARD_INACTIVITY",
          "No keyboard or mouse activity for 3 minutes",
        );
      }
    }, 15000);

    // Extended displays (Chromium only): a second screen is a classic way to
    // read answers off-camera.
    const screenDetails = window.screen as Screen & {
      isExtended?: boolean;
      addEventListener?: EventTarget["addEventListener"];
      removeEventListener?: EventTarget["removeEventListener"];
    };
    const checkScreens = () => {
      if (screenDetails.isExtended) {
        reportViolation("MULTIPLE_SCREENS", "Multiple displays are connected");
      }
    };
    checkScreens();

    // Capture phase so editor widgets that stop propagation can't hide events.
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("mousemove", markActive);
    document.addEventListener("mousedown", markActive);
    document.addEventListener("contextmenu", preventContextMenu);
    screenDetails.addEventListener?.("change", checkScreens);

    return () => {
      clearTimeout(blurTimer);
      clearInterval(inactivityTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("mousemove", markActive);
      document.removeEventListener("mousedown", markActive);
      document.removeEventListener("contextmenu", preventContextMenu);
      screenDetails.removeEventListener?.("change", checkScreens);
    };
  }, [enabled, reportViolation]);

  // Camera signals: camera off/covered, no face, multiple faces, looking away.
  useEffect(() => {
    if (!enabled || !videoStream) return;

    const monitor = new FaceMonitor(videoStream);
    let disposed = false;
    monitor.init().then((mode) => !disposed && setMonitorMode(mode));

    // Each episode is reported once, then re-armed when the condition clears.
    const streak = { noFace: 0, multi: 0, away: 0, dark: 0 };
    const active = {
      cameraOff: false,
      noFace: false,
      multi: false,
      away: false,
    };

    const timer = setInterval(() => {
      const track = videoStream.getVideoTracks()[0];
      const cameraOff =
        !track || track.readyState === "ended" || !track.enabled || track.muted;
      if (cameraOff) {
        if (!active.cameraOff) {
          active.cameraOff = true;
          reportViolation("CAMERA_OFF", "Camera was turned off or disconnected");
        }
        return;
      }

      const frame = monitor.analyze();
      if (!frame) return;

      streak.dark = frame.dark ? streak.dark + 1 : 0;
      if (streak.dark >= DARK_CHECKS && !active.cameraOff) {
        active.cameraOff = true;
        reportViolation("CAMERA_OFF", "Camera appears to be covered");
      } else if (streak.dark === 0) {
        active.cameraOff = false;
      }

      if (frame.faces === null) return;

      streak.noFace = frame.faces === 0 && !frame.dark ? streak.noFace + 1 : 0;
      if (streak.noFace >= NO_FACE_CHECKS && !active.noFace) {
        active.noFace = true;
        reportViolation("NO_FACE", "Candidate is not visible on camera");
      } else if (streak.noFace === 0) {
        active.noFace = false;
      }

      streak.multi = frame.faces > 1 ? streak.multi + 1 : 0;
      if (streak.multi >= MULTI_FACE_CHECKS && !active.multi) {
        active.multi = true;
        reportViolation(
          "MULTIPLE_FACES",
          `${frame.faces} people detected on camera`,
          { faces: frame.faces },
        );
      } else if (streak.multi === 0) {
        active.multi = false;
      }

      streak.away = frame.lookingAway ? streak.away + 1 : 0;
      if (streak.away >= LOOK_AWAY_CHECKS && !active.away) {
        active.away = true;
        reportViolation(
          "EYE_MOVEMENT",
          "Candidate is looking away from the screen",
        );
      } else if (streak.away === 0) {
        active.away = false;
      }
    }, FACE_CHECK_MS);

    return () => {
      disposed = true;
      clearInterval(timer);
      monitor.dispose();
    };
  }, [enabled, videoStream, reportViolation]);

  /**
   * Call from the editor's change handler with the number of characters a
   * single local edit inserted. Large insertions that didn't come from a
   * paste event point to auto-typers or injected code.
   */
  const trackCodeInsertion = useCallback(
    (insertedChars: number) => {
      if (!enabled || insertedChars < LARGE_INSERT_CHARS) return;
      if (Date.now() - lastPasteAt.current < 1000) return;
      reportViolation(
        "EXTERNAL_PASTE",
        `${insertedChars} characters inserted at once without a paste`,
        { length: insertedChars, via: "insertion" },
      );
    },
    [enabled, reportViolation],
  );

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Fullscreen request failed:", error);
    }
  }, []);

  return {
    violations,
    isFullscreen,
    enterFullscreen,
    faceMode: enabled && videoStream ? monitorMode : ("off" as const),
    reportViolation,
    trackCodeInsertion,
  };
};
