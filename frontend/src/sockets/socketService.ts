import { io, Socket } from "socket.io-client";
import { store } from "../redux/store";
import { refreshAccessToken } from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export interface JoinRoomResult {
  ok: boolean;
  error?: string;
  isStaff?: boolean;
  peers?: { socketId: string; userId: string; name: string; role: string }[];
}

class SocketService {
  private socket: Socket | null = null;

  connect(namespace: string = "/interview") {
    if (this.socket) return this.socket;

    this.socket = io(`${SOCKET_URL}${namespace}`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      // Read the token on every (re)connect so refreshed tokens are picked up.
      auth: (cb) => cb({ token: store.getState().auth.accessToken }),
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    // Auth failures aren't retried automatically by socket.io: refresh the
    // access token once and reconnect.
    let refreshed = false;
    this.socket.on("connect_error", async (err) => {
      console.error("Socket connection error:", err.message);
      if (refreshed || !/token|auth/i.test(err.message)) return;
      refreshed = true;
      try {
        await refreshAccessToken();
        this.socket?.connect();
      } catch {
        // api.ts handles logout when the refresh token is invalid too
      }
    });
    this.socket.on("connect", () => {
      refreshed = false;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return this.socket;
  }

  joinRoom(roomId: string): Promise<JoinRoomResult> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ ok: false, error: "Not connected" });
      this.socket
        .timeout(10000)
        .emit("join-room", roomId, (err: Error | null, res: JoinRoomResult) =>
          resolve(err ? { ok: false, error: "Join timed out" } : res),
        );
    });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit("leave-room", roomId);
  }

  // Code collaboration
  sendCodeChange(roomId: string, code: string, language: string) {
    this.socket?.emit("code-change", { roomId, code, language });
  }

  // Chat — the server echoes the message back to everyone, including sender.
  sendMessage(roomId: string, message: string) {
    this.socket?.emit("chat-message", { roomId, message });
  }

  // WebRTC Signaling
  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, to: string) {
    this.socket?.emit("offer", { roomId, offer, to });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, to: string) {
    this.socket?.emit("answer", { roomId, answer, to });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, to: string) {
    this.socket?.emit("ice-candidate", { roomId, candidate, to });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
