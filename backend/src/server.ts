import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { setupChatHandlers } from "./socket/chatHandlers";
import { logger } from "./utils/logger";

const port = Number(process.env.PORT ?? 4000);

const app = createApp();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: false,
  },
});

setupChatHandlers(io);

// Make io available to other modules
app.set("io", io);

httpServer.listen(port, () => {
  logger.info(`Farmer chat backend listening on http://localhost:${port}`);
});
