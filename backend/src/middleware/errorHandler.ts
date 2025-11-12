import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { HttpError, isHttpError } from "../utils/httpError";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "リクエスト形式が正しくありません。",
      issues: error.issues,
    });
  }

  if (isHttpError(error)) {
    return res.status(error.status).json({
      error: "HttpError",
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: "InternalServerError",
    message: "予期せぬエラーが発生しました。",
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: "NotFound",
    message: "指定されたエンドポイントは存在しません。",
  });
};

