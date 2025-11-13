import type { Request, Response, NextFunction } from "express";
import { cache, cacheKeys } from "../utils/cache";

export const cacheMiddleware = (ttlSeconds = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key from request
    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      cache.set(cacheKey, body, ttlSeconds);
      return originalJson(body);
    };

    next();
  };
};

