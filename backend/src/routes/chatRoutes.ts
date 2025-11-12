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

export const chatRouter = Router();

chatRouter.get("/threads", getThreadsHandler);
chatRouter.get("/threads/:threadId", getThreadDetailHandler);
chatRouter.post("/threads/dm", postDmThreadHandler);
chatRouter.post("/threads/group", postGroupThreadHandler);
chatRouter.post("/threads/:threadId/messages", postThreadMessageHandler);
chatRouter.post("/threads/:threadId/read", postThreadReadHandler);
chatRouter.post("/opportunities/:opportunityId/broadcast", postBroadcastHandler);
chatRouter.get("/opportunities", getOpportunitiesHandler);

