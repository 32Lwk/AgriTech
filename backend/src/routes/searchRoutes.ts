import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { searchAll, searchMessages, searchOpportunities } from "../services/searchService";

export const searchRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(["all", "messages", "opportunities"]).optional().default("all"),
  farmerId: z.string().min(1).optional(),
});

searchRouter.get("/", async (req: Request, res: Response) => {
  const params = searchQuerySchema.parse(req.query);

  let results;
  switch (params.type) {
    case "messages":
      results = await searchMessages(params.q, params.farmerId);
      break;
    case "opportunities":
      results = await searchOpportunities(params.q, params.farmerId);
      break;
    default:
      results = await searchAll(params.q, params.farmerId);
  }

  res.json({
    query: params.q,
    type: params.type,
    results,
    count: results.length,
  });
});

