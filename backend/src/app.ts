import express from "express";
import cors from "cors";

import { chatRouter } from "./routes/chatRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: false,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/chat", chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

