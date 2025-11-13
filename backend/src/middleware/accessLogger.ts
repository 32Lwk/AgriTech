import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const accessLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 400) {
      logger.warn("HTTP request", logData);
    } else {
      logger.info("HTTP request", logData);
    }
  });

  next();
};

