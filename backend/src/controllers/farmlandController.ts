import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createFarmland,
  getFarmlandsByFarmer,
  getFarmlandById,
  updateFarmland,
  deleteFarmland,
} from "../services/farmlandService";

const createFarmlandSchema = z.object({
  farmerId: z.string().min(1),
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  imageUrls: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const updateFarmlandSchema = z.object({
  name: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const createFarmlandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = createFarmlandSchema.parse(req.body);
    const farmland = await createFarmland(body);
    res.status(201).json(farmland);
  } catch (error) {
    next(error);
  }
};

export const getFarmlandsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const farmerId = z.string().min(1).parse(req.query.farmerId);
    const farmlands = await getFarmlandsByFarmer(farmerId);
    res.json(farmlands);
  } catch (error) {
    console.error("Error in getFarmlandsHandler:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid farmerId parameter", errors: error.errors });
    }
    next(error);
  }
};

export const getFarmlandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const farmlandId = z.string().min(1).parse(req.params.farmlandId);
    const farmerId = z.string().min(1).parse(req.query.farmerId);
    const farmland = await getFarmlandById(farmlandId, farmerId);
    res.json(farmland);
  } catch (error) {
    next(error);
  }
};

export const updateFarmlandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const farmlandId = z.string().min(1).parse(req.params.farmlandId);
    const farmerId = z.string().min(1).parse(req.query.farmerId);
    const body = updateFarmlandSchema.parse(req.body);
    const farmland = await updateFarmland(farmlandId, farmerId, body);
    res.json(farmland);
  } catch (error) {
    next(error);
  }
};

export const deleteFarmlandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const farmlandId = z.string().min(1).parse(req.params.farmlandId);
    const farmerId = z.string().min(1).parse(req.query.farmerId);
    await deleteFarmland(farmlandId, farmerId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

