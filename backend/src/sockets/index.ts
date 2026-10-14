import { Server as SocketServer, Namespace, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { corsOrigin } from "../config/cors";
import logger from "../config/logger";
import prisma from "../config/database";
import { InterviewService } from "../services/interview.service";

interface SocketUser {
  id: string;
  role: string;
  name: string;
}

interface RoomMembership {
  interviewId: string | null; // null for a personal practice room
  isStaff: boolean;
}

interface InterviewSocket extends Socket {
  data: {
    user: SocketUser;
    rooms: Map<string, RoomMembership>;
  };
}

let interviewNs: Namespace | null = null;

const staffRoom = (roomId: string) => `${roomId}:staff`;

/**
 * Emit to everyone in an interview room (keyed by meetingId). With
 * `staffOnly`, only recruiters/admins receive it — used for proctoring alerts
 * so the candidate can't watch what is being flagged.
 */
export const emitToRoom = (
  roomId: string,
  event: string,
  payload: unknown,
  options: { staffOnly?: boolean } = {},
) => {
  interviewNs
    ?.to(options.staffOnly ? staffRoom(roomId) : roomId)
    .emit(event, payload);
};

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Interview room namespace
  const ns = io.of("/interview");
  interviewNs = ns;

  ns.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, config.jwt.accessSecret) as {
        id: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });
      if (!user || !user.isActive) return next(new Error("Invalid user"));

      socket.data.user = {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`.trim(),
      };
      socket.data.rooms = new Map();
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  ns.on("connection", (rawSocket) => {
    const socket = rawSocket as InterviewSocket;
    const user = socket.data.user;
    logger.info(`Socket connected: ${socket.id} (user ${user.id})`);

    const inRoom = (roomId: unknown): roomId is string =>
      typeof roomId === "string" && socket.data.rooms.has(roomId);

    socket.on(
      "join-room",
      async (roomId: unknown, ack?: (res: unknown) => void) => {
        const reply = typeof ack === "function" ? ack : () => {};
        if (typeof roomId !== "string" || !roomId) {
          return reply({ ok: false, error: "roomId required" });
        }

        try {
          let membership: RoomMembership;
          if (roomId === `practice-${user.id}`) {
            membership = { interviewId: null, isStaff: false };
          } else {
            const interview = await prisma.interview.findUnique({
              where: { meetingId: roomId },
              select: { id: true },
            });
            if (!interview) return reply({ ok: false, error: "Not found" });
            const { isStaff } = await InterviewService.assertAccess(
              interview.id,
              user,
            );
            membership = { interviewId: interview.id, isStaff };
          }

          socket.data.rooms.set(roomId, membership);
          await socket.join(roomId);
          if (membership.isStaff) await socket.join(staffRoom(roomId));

          // Tell the newcomer who is already here, and tell them about it.
          const peers = (await ns.in(roomId).fetchSockets())
            .filter((s) => s.id !== socket.id)
            .map((s) => ({
              socketId: s.id,
              userId: s.data.user?.id,
              name: s.data.user?.name,
              role: s.data.user?.role,
            }));

          socket.to(roomId).emit("user-joined", {
            socketId: socket.id,
            userId: user.id,
            name: user.name,
            role: user.role,
          });
          logger.info(`User ${user.id} joined room ${roomId}`);
          reply({ ok: true, peers, isStaff: membership.isStaff });
        } catch (error) {
          reply({
            ok: false,
            error: error instanceof Error ? error.message : "Join failed",
          });
        }
      },
    );

    // Code collaboration
    socket.on(
      "code-change",
      (data: { roomId: string; code: string; language: string }) => {
        if (!inRoom(data?.roomId)) return;
        socket.to(data.roomId).emit("code-update", {
          code: data.code,
          language: data.language,
        });
      },
    );

    socket.on("code-cursor", (data: { roomId: string; cursor: unknown }) => {
      if (!inRoom(data?.roomId)) return;
      socket.to(data.roomId).emit("cursor-update", data.cursor);
    });

    // Chat — persisted for interview rooms so it can feed the AI report.
    socket.on(
      "chat-message",
      async (data: { roomId: string; message: string }) => {
        if (!inRoom(data?.roomId)) return;
        const text = String(data.message ?? "")
          .trim()
          .slice(0, 2000);
        if (!text) return;

        const membership = socket.data.rooms.get(data.roomId)!;
        let id: string = `${socket.id}-${Date.now()}`;
        let createdAt = new Date();
        if (membership.interviewId) {
          try {
            const saved = await prisma.chatMessage.create({
              data: {
                interviewId: membership.interviewId,
                senderId: user.id,
                message: text,
              },
            });
            id = saved.id;
            createdAt = saved.createdAt;
          } catch (error) {
            logger.error("Failed to persist chat message:", error);
          }
        }

        ns.to(data.roomId).emit("new-message", {
          id,
          message: text,
          senderId: user.id,
          senderName: user.name,
          timestamp: createdAt,
        });
      },
    );

    // WebRTC signaling — only relay between sockets in the same room.
    const relay = (event: string, key: "offer" | "answer" | "candidate") => {
      socket.on(
        event,
        (data: { roomId: string; to: string; [k: string]: unknown }) => {
          if (!inRoom(data?.roomId)) return;
          const target = ns.sockets.get(data.to);
          if (!target?.rooms.has(data.roomId)) return;
          target.emit(event, { [key]: data[key], from: socket.id });
        },
      );
    };
    relay("offer", "offer");
    relay("answer", "answer");
    relay("ice-candidate", "candidate");

    const leave = (roomId: string) => {
      socket.data.rooms.delete(roomId);
      socket.leave(roomId);
      socket.leave(staffRoom(roomId));
      socket
        .to(roomId)
        .emit("user-left", { userId: user.id, socketId: socket.id });
    };

    socket.on("leave-room", (roomId: unknown) => {
      if (inRoom(roomId)) leave(roomId);
    });

    socket.on("disconnecting", () => {
      for (const roomId of [...socket.data.rooms.keys()]) leave(roomId);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
