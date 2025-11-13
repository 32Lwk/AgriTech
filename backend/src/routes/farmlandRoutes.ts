import { Router } from "express";
import {
  createFarmlandHandler,
  getFarmlandsHandler,
  getFarmlandHandler,
  updateFarmlandHandler,
  deleteFarmlandHandler,
} from "../controllers/farmlandController";

export const farmlandRouter = Router();

farmlandRouter.post("/", createFarmlandHandler);
farmlandRouter.get("/", getFarmlandsHandler);
farmlandRouter.get("/:farmlandId", getFarmlandHandler);
farmlandRouter.put("/:farmlandId", updateFarmlandHandler);
farmlandRouter.delete("/:farmlandId", deleteFarmlandHandler);

