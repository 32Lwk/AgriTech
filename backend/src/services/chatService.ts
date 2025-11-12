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

export const listThreads = (params: ChatQueryParams): ChatThreadSummary[] => {
  const includeClosed = params.includeClosed ?? false;
  return chatStore.listThreads(params.farmerId, includeClosed);
};

export const getThreadDetail = (threadId: string, farmerId: string): ChatThreadDetail => {
  return chatStore.getThreadDetail(threadId, farmerId);
};

export const createDmThread = (input: CreateDmThreadInput) => {
  return chatStore.createDmThread(input);
};

export const createGroupThread = (input: CreateGroupThreadInput) => {
  return chatStore.createGroupThread(input);
};

export const postMessage = (threadId: string, input: PostMessageInput, farmerId: string) => {
  return chatStore.postMessage(threadId, input, farmerId);
};

export const markThreadRead = (threadId: string, input: MarkThreadReadInput) => {
  return chatStore.markThreadRead(threadId, input);
};

export const broadcastToOpportunity = (opportunityId: string, input: BroadcastMessageInput) => {
  return chatStore.broadcastToOpportunity(opportunityId, input);
};

export const listOpportunitiesWithParticipants = (farmerId: string): Opportunity[] => {
  return chatStore.listOpportunitiesWithParticipants(farmerId);
};

