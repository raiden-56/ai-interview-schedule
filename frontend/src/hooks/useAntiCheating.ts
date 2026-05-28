import { useCallback, useEffect, useRef, useState } from "react";
import socketService from "../sockets/socketService";

interface UseAntiCheatingOptions {
  roomId: string;
  enabled?: boolean;
}

export const useAntiCheating = ({
  roomId,
  enabled = true,
}: UseAntiCheatingOptions) => {
  const [violations, setViolations] = useState<any[]>([]);
  const tabSwitchCount = useRef(0);

  const reportViolation = useCallback(
    (eventType: string, details: string) => {
      const violation = { eventType, details, timestamp: new Date() };
      setViolations((prev) => [...prev, violation]);
      socketService.sendCheatingEvent(roomId, eventType, details);
    },
    [roomId],
  );

  useEffect(() => {
    if (!enabled) return;

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        reportViolation("TAB_SWITCH", `Tab switch #${tabSwitchCount.current}`);
      }
    };

    // Browser blur detection
    const handleBlur = () => {
      reportViolation("BROWSER_BLUR", "Browser lost focus");
    };

    // Copy/paste detection
    const handleCopy = (e: ClipboardEvent) => {
      reportViolation("COPY_PASTE", "Copy event detected");
    };

    const handlePaste = (e: ClipboardEvent) => {
      reportViolation("COPY_PASTE", "Paste event detected");
    };

    // Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportViolation("FULLSCREEN_EXIT", "Exited fullscreen mode");
      }
    };

    // Keyboard inactivity detection
    let lastKeyPress = Date.now();
    const inactivityTimer = setInterval(() => {
      if (Date.now() - lastKeyPress > 120000) {
        // 2 minutes
        reportViolation(
          "KEYBOARD_INACTIVITY",
          "No keyboard activity for 2 minutes",
        );
        lastKeyPress = Date.now();
      }
    }, 30000);

    const handleKeyPress = () => {
      lastKeyPress = Date.now();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keypress", handleKeyPress);
      clearInterval(inactivityTimer);
    };
  }, [enabled, reportViolation]);

  return { violations, reportViolation };
};
