import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { config } from "../config";
import logger from "../config/logger";

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Interview room namespace
  const interviewNs = io.of("/interview");

  interviewNs.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join-room", (roomId: string, userId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
      logger.info(`User ${userId} joined room ${roomId}`);
    });

    // Code collaboration
    socket.on(
      "code-change",
      (data: { roomId: string; code: string; language: string }) => {
        socket.to(data.roomId).emit("code-update", {
          code: data.code,
          language: data.language,
        });
      },
    );

    socket.on("code-cursor", (data: { roomId: string; cursor: any }) => {
      socket.to(data.roomId).emit("cursor-update", data.cursor);
    });

    // Chat
    socket.on(
      "chat-message",
      (data: { roomId: string; message: string; senderId: string }) => {
        interviewNs.to(data.roomId).emit("new-message", {
          message: data.message,
          senderId: data.senderId,
          timestamp: new Date(),
        });
      },
    );

    // WebRTC signaling
    socket.on("offer", (data: { roomId: string; offer: any; to: string }) => {
      socket.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
    });

    socket.on("answer", (data: { roomId: string; answer: any; to: string }) => {
      socket
        .to(data.to)
        .emit("answer", { answer: data.answer, from: socket.id });
    });

    socket.on(
      "ice-candidate",
      (data: { roomId: string; candidate: any; to: string }) => {
        socket.to(data.to).emit("ice-candidate", {
          candidate: data.candidate,
          from: socket.id,
        });
      },
    );

    // Anti-cheating events
    socket.on(
      "cheating-event",
      (data: { roomId: string; eventType: string; details: string }) => {
        socket.to(data.roomId).emit("cheating-detected", {
          eventType: data.eventType,
          details: data.details,
          timestamp: new Date(),
        });
      },
    );

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on("leave-room", (roomId: string, userId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", { userId, socketId: socket.id });
    });
  });

  return io;
};
