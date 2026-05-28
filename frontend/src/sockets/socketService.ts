import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  connect(namespace: string = "/interview") {
    this.socket = io(`${SOCKET_URL}${namespace}`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return this.socket;
  }

  joinRoom(roomId: string, userId: string) {
    this.socket?.emit("join-room", roomId, userId);
  }

  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit("leave-room", roomId, userId);
  }

  // Code collaboration
  sendCodeChange(roomId: string, code: string, language: string) {
    this.socket?.emit("code-change", { roomId, code, language });
  }

  onCodeUpdate(callback: (data: { code: string; language: string }) => void) {
    this.socket?.on("code-update", callback);
  }

  // Chat
  sendMessage(roomId: string, message: string, senderId: string) {
    this.socket?.emit("chat-message", { roomId, message, senderId });
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on("new-message", callback);
  }

  // WebRTC Signaling
  sendOffer(roomId: string, offer: any, to: string) {
    this.socket?.emit("offer", { roomId, offer, to });
  }

  sendAnswer(roomId: string, answer: any, to: string) {
    this.socket?.emit("answer", { roomId, answer, to });
  }

  sendIceCandidate(roomId: string, candidate: any, to: string) {
    this.socket?.emit("ice-candidate", { roomId, candidate, to });
  }

  onOffer(callback: (data: { offer: any; from: string }) => void) {
    this.socket?.on("offer", callback);
  }

  onAnswer(callback: (data: { answer: any; from: string }) => void) {
    this.socket?.on("answer", callback);
  }

  onIceCandidate(callback: (data: { candidate: any; from: string }) => void) {
    this.socket?.on("ice-candidate", callback);
  }

  // Anti-cheating
  sendCheatingEvent(roomId: string, eventType: string, details: string) {
    this.socket?.emit("cheating-event", { roomId, eventType, details });
  }

  onCheatingDetected(callback: (data: any) => void) {
    this.socket?.on("cheating-detected", callback);
  }

  onUserJoined(callback: (data: { userId: string; socketId: string }) => void) {
    this.socket?.on("user-joined", callback);
  }

  onUserLeft(callback: (data: { userId: string; socketId: string }) => void) {
    this.socket?.on("user-left", callback);
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
