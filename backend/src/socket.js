import jwt from "jsonwebtoken";
import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer) {
  const origin = process.env.CLIENT_URL || "http://localhost:3000";
  io = new Server(httpServer, {
    cors: { origin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(payload.id);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitNotification(userId, notification) {
  if (!io || !userId) return;
  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: notification.action || "Update",
    subject: notification.subject || "",
    time: new Date().toISOString(),
    href: notification.href,
    kind: notification.kind || "default",
  };
  io.to(`user:${userId}`).emit("notification", payload);
}

export function emitNotificationToUsers(userIds, notification, exceptUserId) {
  const unique = [...new Set(userIds.map(String))].filter(
    (id) => id && id !== String(exceptUserId)
  );
  for (const id of unique) {
    emitNotification(id, notification);
  }
}
