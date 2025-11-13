import { Router } from "express";
import type { Request, Response } from "express";
import { upload } from "../middleware/upload";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

export const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "ファイルがアップロードされませんでした。");
  }

  logger.info("File uploaded", {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });

  const baseUrl = process.env.API_BASE_URL || "http://localhost:4000";
  res.json({
    success: true,
    file: {
      id: req.file.filename,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `${baseUrl}/uploads/${req.file.filename}`,
    },
  });
});

uploadRouter.post("/multiple", upload.array("files", 10), (req: Request, res: Response) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    throw new HttpError(400, "ファイルがアップロードされませんでした。");
  }

  const files = Array.isArray(req.files) ? req.files : [req.files];

  logger.info("Multiple files uploaded", { count: files.length });

  const baseUrl = process.env.API_BASE_URL || "http://localhost:4000";
  res.json({
    success: true,
    files: files.map((file) => ({
      id: file.filename,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/${file.filename}`,
    })),
  });
});

