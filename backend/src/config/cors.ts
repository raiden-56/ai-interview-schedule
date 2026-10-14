import { config } from "./index";

// Browsers send origins without a trailing slash; tolerate "http://x:5174/" in env.
const allowedOrigins = new Set(
  config.cors.origins.map((o) => o.replace(/\/+$/, "")),
);

// In development also accept the dev server however it was opened:
// localhost, 127.0.0.1, or the LAN address Vite prints (any port).
const DEV_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

export const isAllowedOrigin = (origin: string | undefined) =>
  // No Origin header: same-origin requests, curl, server-to-server.
  !origin ||
  allowedOrigins.has(origin) ||
  (config.nodeEnv !== "production" && DEV_ORIGIN.test(origin));

/** Shared by Express and Socket.IO so both accept the same origins. */
export const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => callback(null, isAllowedOrigin(origin));
