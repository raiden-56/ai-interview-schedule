// Webcam-based proctoring signals: face count, head turned away, and a
// "camera covered / dark" fallback when face detection can't be loaded.

// Keep in sync with the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_VERSION = "1.0.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

export type FaceMonitorMode = "loading" | "face-detection" | "brightness-only";

export interface FrameAnalysis {
  /** Number of faces, or null when face detection isn't available. */
  faces: number | null;
  /** True when the (single) face is turned well away from the screen. */
  lookingAway: boolean;
  /** True when the frame is almost uniformly black (covered camera). */
  dark: boolean;
}

interface Detector {
  detectForVideo(
    video: HTMLVideoElement,
    timestamp: number,
  ): {
    detections: { keypoints: { x: number; y: number }[] }[];
  };
  close(): void;
}

let detectorPromise: Promise<Detector | null> | null = null;

const loadDetector = () => {
  detectorPromise ??= (async () => {
    try {
      const { FilesetResolver, FaceDetector } = await import(
        "@mediapipe/tasks-vision"
      );
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const create = (delegate: "GPU" | "CPU") =>
        FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        });
      return (await create("GPU").catch(() => create("CPU"))) as Detector;
    } catch (error) {
      console.warn("Face detection unavailable, using brightness check:", error);
      detectorPromise = null; // allow a retry on the next interview
      return null;
    }
  })();
  return detectorPromise;
};

/**
 * Head yaw from BlazeFace keypoints (0 = right eye, 1 = left eye, 2 = nose):
 * how far the nose sits from the midpoint between the eyes, relative to the
 * eye distance. ~0 when facing the camera, grows as the head turns.
 */
const yawRatio = (keypoints: { x: number; y: number }[]) => {
  if (keypoints.length < 3) return 0;
  const [rightEye, leftEye, nose] = keypoints;
  const eyeDistance = Math.abs(leftEye.x - rightEye.x);
  if (eyeDistance < 1e-3) return 1;
  return Math.abs(nose.x - (leftEye.x + rightEye.x) / 2) / eyeDistance;
};

const LOOKING_AWAY_YAW = 0.45;

export class FaceMonitor {
  private video: HTMLVideoElement;
  private canvas = document.createElement("canvas");
  private detector: Detector | null = null;
  mode: FaceMonitorMode = "loading";

  constructor(stream: MediaStream) {
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
    this.video.play().catch(() => {});
    this.canvas.width = 32;
    this.canvas.height = 24;
  }

  async init() {
    this.detector = await loadDetector();
    this.mode = this.detector ? "face-detection" : "brightness-only";
    return this.mode;
  }

  analyze(): FrameAnalysis | null {
    if (this.video.readyState < 2 || this.video.videoWidth === 0) return null;

    const dark = this.isDark();
    if (!this.detector) return { faces: null, lookingAway: false, dark };

    try {
      const { detections } = this.detector.detectForVideo(
        this.video,
        performance.now(),
      );
      const lookingAway =
        detections.length === 1 &&
        yawRatio(detections[0].keypoints) > LOOKING_AWAY_YAW;
      return { faces: detections.length, lookingAway, dark };
    } catch {
      return { faces: null, lookingAway: false, dark };
    }
  }

  private isDark() {
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const { data } = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    let sum = 0;
    let sumSq = 0;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += luma;
      sumSq += luma * luma;
    }
    const mean = sum / pixels;
    const stdDev = Math.sqrt(Math.max(0, sumSq / pixels - mean * mean));
    return mean < 15 && stdDev < 8;
  }

  dispose() {
    this.video.pause();
    this.video.srcObject = null;
    // The detector is shared across interviews; keep it loaded.
  }
}
