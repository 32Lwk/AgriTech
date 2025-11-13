import { Router } from "express";
import {
  createOpportunity,
  getOpportunities,
  getOpportunity,
} from "../controllers/opportunityController";

export const opportunityRouter = Router();

opportunityRouter.post("/", createOpportunity);
opportunityRouter.get("/", getOpportunities);
opportunityRouter.get("/:opportunityId", getOpportunity);

