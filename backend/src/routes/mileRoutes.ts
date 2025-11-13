import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  createMileTransaction,
  getMileBalance,
  getMileHistory,
  type CreateMileTransactionInput,
} from "../services/mileService";

export const mileRouter = Router();

const createTransactionSchema = z.object({
  farmerId: z.string().min(1),
  type: z.enum(["earn", "spend", "exchange"]),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  opportunityId: z.string().optional(),
});

mileRouter.get("/balance/:farmerId", async (req: Request, res: Response) => {
  const { farmerId } = z.object({ farmerId: z.string().min(1) }).parse(req.params);
  const balance = await getMileBalance(farmerId);
  res.json(balance);
});

mileRouter.get("/history/:farmerId", async (req: Request, res: Response) => {
  const { farmerId } = z.object({ farmerId: z.string().min(1) }).parse(req.params);
  const limit = z.coerce.number().int().positive().max(100).optional().parse(req.query.limit) ?? 50;
  const transactions = await getMileHistory(farmerId, limit);
  res.json({ transactions });
});

mileRouter.post("/transaction", async (req: Request, res: Response) => {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await createMileTransaction(body);
  res.status(201).json(transaction);
});

