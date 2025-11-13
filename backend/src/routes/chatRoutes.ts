import { Router } from "express";

import {
  getOpportunitiesHandler,
  getThreadDetailHandler,
  getThreadsHandler,
  postBroadcastHandler,
  postDmThreadHandler,
  postGroupThreadHandler,
  postThreadMessageHandler,
  postThreadReadHandler,
} from "../controllers/chatController";
import { cacheMiddleware } from "../middleware/cache";

export const chatRouter = Router();

// Apply caching to GET endpoints
chatRouter.get("/threads", cacheMiddleware(60), getThreadsHandler);
chatRouter.get("/threads/:threadId", cacheMiddleware(60), getThreadDetailHandler);
chatRouter.post("/threads/dm", postDmThreadHandler);
chatRouter.post("/threads/group", postGroupThreadHandler);
chatRouter.post("/threads/:threadId/messages", postThreadMessageHandler);
chatRouter.post("/threads/:threadId/read", postThreadReadHandler);
chatRouter.post("/opportunities/:opportunityId/broadcast", postBroadcastHandler);
chatRouter.get("/opportunities", getOpportunitiesHandler);

