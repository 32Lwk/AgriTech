import express from "express";
import cors from "cors";
import path from "path";

import { chatRouter } from "./routes/chatRoutes";
import { uploadRouter } from "./routes/uploadRoutes";
import { searchRouter } from "./routes/searchRoutes";
import { mileRouter } from "./routes/mileRoutes";
import { farmlandRouter } from "./routes/farmlandRoutes";
import { opportunityRouter } from "./routes/opportunityRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { accessLogger } from "./middleware/accessLogger";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: false,
    }),
  );
  app.use(express.json());
  app.use(accessLogger);

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/chat", chatRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/miles", mileRouter);
  app.use("/api/farmlands", farmlandRouter);
  app.use("/api/opportunities", opportunityRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
