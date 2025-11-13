import type { Server as SocketIOServer } from "socket.io";
import type {
  BroadcastMessageInput,
  ChatThreadDetail,
  ChatThreadSummary,
  ChatQueryParams,
  CreateDmThreadInput,
  CreateGroupThreadInput,
  MarkThreadReadInput,
  Opportunity,
  PostMessageInput,
} from "../types/chat";
import { chatStore } from "../store/chatStore";
import { emitNewMessage, emitThreadUpdate } from "../socket/chatHandlers";

let ioInstance: SocketIOServer | null = null;

export const setSocketIO = (io: SocketIOServer) => {
  ioInstance = io;
};

export const listThreads = async (params: ChatQueryParams): Promise<ChatThreadSummary[]> => {
  const includeClosed = params.includeClosed ?? false;
  return chatStore.listThreads(params.farmerId, includeClosed);
};

export const getThreadDetail = async (threadId: string, farmerId: string): Promise<ChatThreadDetail> => {
  return chatStore.getThreadDetail(threadId, farmerId);
};

export const createDmThread = async (input: CreateDmThreadInput) => {
  const result = await chatStore.createDmThread(input);
  invalidateThreadCache(input.farmerId);
  if (ioInstance) {
    emitThreadUpdate(ioInstance, result.id, result);
  }
  return result;
};

export const createGroupThread = async (input: CreateGroupThreadInput) => {
  const result = await chatStore.createGroupThread(input);
  invalidateThreadCache(input.farmerId);
  if (ioInstance) {
    emitThreadUpdate(ioInstance, result.id, result);
  }
  return result;
};

export const postMessage = async (threadId: string, input: PostMessageInput, farmerId: string) => {
  const result = await chatStore.postMessage(threadId, input, farmerId);
  invalidateThreadDetailCache(threadId, farmerId);
  if (ioInstance) {
    emitNewMessage(ioInstance, threadId, result.message);
    emitThreadUpdate(ioInstance, threadId, result.thread);
  }
  return result;
};

export const markThreadRead = async (threadId: string, input: MarkThreadReadInput) => {
  const result = await chatStore.markThreadRead(threadId, input);
  if (ioInstance) {
    emitThreadUpdate(ioInstance, threadId, result);
  }
  return result;
};

export const broadcastToOpportunity = async (opportunityId: string, input: BroadcastMessageInput) => {
  const result = await chatStore.broadcastToOpportunity(opportunityId, input);
  invalidateThreadDetailCache(result.thread.id, input.farmerId);
  if (ioInstance) {
    emitNewMessage(ioInstance, result.thread.id, result.message);
    emitThreadUpdate(ioInstance, result.thread.id, result.thread);
  }
  return result;
};

export const listOpportunitiesWithParticipants = async (farmerId: string): Promise<Opportunity[]> => {
  return chatStore.listOpportunitiesWithParticipants(farmerId);
};
