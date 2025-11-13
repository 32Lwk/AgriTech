import type { Request, Response } from "express";
import { z } from "zod";

import {
  broadcastMessageSchema,
  chatQuerySchema,
  createDmThreadSchema,
  createGroupThreadSchema,
  markThreadReadSchema,
  postMessageSchema,
} from "../types/chat";
import {
  broadcastToOpportunity,
  createDmThread,
  createGroupThread,
  getThreadDetail,
  listOpportunitiesWithParticipants,
  listThreads,
  markThreadRead,
  postMessage,
} from "../services/chatService";
import { HttpError } from "../utils/httpError";

const threadIdParamsSchema = z.object({
  threadId: z.string().min(1),
});

const opportunityParamsSchema = z.object({
  opportunityId: z.string().min(1),
});

export const getThreadsHandler = async (req: Request, res: Response) => {
  const params = chatQuerySchema.parse(req.query);
  const threads = await listThreads(params);
  res.json({ threads });
};

export const getThreadDetailHandler = async (req: Request, res: Response) => {
  const { threadId } = threadIdParamsSchema.parse(req.params);
  const farmerId = z.string().min(1).parse(req.query.farmerId);
  const detail = await getThreadDetail(threadId, farmerId);
  res.json(detail);
};

export const postDmThreadHandler = async (req: Request, res: Response) => {
  const body = createDmThreadSchema.parse(req.body);
  const thread = await createDmThread(body);
  res.status(201).json(thread);
};

export const postGroupThreadHandler = async (req: Request, res: Response) => {
  const body = createGroupThreadSchema.parse(req.body);
  const thread = await createGroupThread(body);
  res.status(201).json(thread);
};

export const postThreadMessageHandler = async (req: Request, res: Response) => {
  const { threadId } = threadIdParamsSchema.parse(req.params);
  const farmerId = z.string().min(1).parse(req.query.farmerId);
  const body = postMessageSchema.parse(req.body);

  if (body.authorRole === "farmer" && body.authorId !== farmerId) {
    throw new HttpError(403, "Farmer ID と投稿者IDが一致していません。");
  }

  const result = await postMessage(threadId, body, farmerId);
  res.status(201).json(result);
};

export const postThreadReadHandler = async (req: Request, res: Response) => {
  const { threadId } = threadIdParamsSchema.parse(req.params);
  const body = markThreadReadSchema.parse(req.body);
  const thread = await markThreadRead(threadId, body);
  res.json(thread);
};

export const postBroadcastHandler = async (req: Request, res: Response) => {
  const { opportunityId } = opportunityParamsSchema.parse(req.params);
  const body = broadcastMessageSchema.parse(req.body);
  const result = await broadcastToOpportunity(opportunityId, body);
  res.status(201).json(result);
};

export const getOpportunitiesHandler = async (req: Request, res: Response) => {
  const farmerId = z.string().min(1).parse(req.query.farmerId);
  const opportunities = await listOpportunitiesWithParticipants(farmerId);
  res.json({ opportunities });
};
