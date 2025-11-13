import type { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";

export const setupChatHandlers = (io: SocketIOServer) => {
  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    // Join room for a specific thread
    socket.on("join:thread", (threadId: string) => {
      socket.join(`thread:${threadId}`);
      logger.debug("Socket joined thread", { socketId: socket.id, threadId });
    });

    // Leave room for a specific thread
    socket.on("leave:thread", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
      logger.debug("Socket left thread", { socketId: socket.id, threadId });
    });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id });
    });
  });
};

export const emitNewMessage = (io: SocketIOServer, threadId: string, message: unknown) => {
  io.to(`thread:${threadId}`).emit("message:new", message);
  logger.debug("Emitted new message", { threadId });
};

export const emitThreadUpdate = (io: SocketIOServer, threadId: string, thread: unknown) => {
  io.to(`thread:${threadId}`).emit("thread:update", thread);
  logger.debug("Emitted thread update", { threadId });
};

