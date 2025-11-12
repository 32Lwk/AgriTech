import { v4 as uuid } from "uuid";

import {
  applicants,
  farmers,
  messages,
  opportunities,
  threadReadStates,
  threads,
} from "./mockData";
import type {
  Applicant,
  BroadcastMessageInput,
  ChatMessage,
  ChatThread,
  ChatThreadDetail,
  ChatThreadSummary,
  CreateDmThreadInput,
  CreateGroupThreadInput,
  MarkThreadReadInput,
  Opportunity,
  PostMessageInput,
  ThreadParticipant,
  ThreadType,
} from "../types/chat";

const farmerMap = new Map(farmers.map((farmer) => [farmer.id, farmer]));
const applicantMap = new Map(applicants.map((applicant) => [applicant.id, applicant]));
const opportunityMap = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));

const getOpportunity = (opportunityId: string): Opportunity => {
  const opportunity = opportunityMap.get(opportunityId);
  if (!opportunity) {
    throw new Error(`Opportunity ${opportunityId} not found`);
  }
  return opportunity;
};

const getApplicant = (applicantId: string): Applicant => {
  const applicant = applicantMap.get(applicantId);
  if (!applicant) throw new Error(`Applicant ${applicantId} not found`);
  return applicant;
};

const getThread = (threadId: string): ChatThread => {
  const thread = threads.find((item) => item.id === threadId);
  if (!thread) {
    throw new Error(`Thread ${threadId} not found`);
  }
  return thread;
};

const getThreadMessages = (threadId: string): ChatMessage[] =>
  messages.filter((message) => message.threadId === threadId).sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

const buildParticipant = (participantId: string): ThreadParticipant | undefined => {
  if (farmerMap.has(participantId)) {
    const farmer = farmerMap.get(participantId)!;
    const participant: ThreadParticipant = {
      id: farmer.id,
      role: "farmer",
      name: farmer.name,
    };
    if (farmer.avatarUrl) {
      participant.avatarUrl = farmer.avatarUrl;
    }
    if (farmer.tagline) {
      participant.tagline = farmer.tagline;
    }
    return participant;
  }
  if (applicantMap.has(participantId)) {
    const applicant = applicantMap.get(participantId)!;
    const participant: ThreadParticipant = {
      id: applicant.id,
      role: "applicant",
      name: applicant.name,
    };
    if (applicant.avatarUrl) {
      participant.avatarUrl = applicant.avatarUrl;
    }
    return participant;
  }
  return undefined;
};

const ensureReadState = (threadId: string, farmerId: string) => {
  const existing = threadReadStates.find(
    (state) => state.threadId === threadId && state.farmerId === farmerId,
  );
  if (existing) return existing;
  const newState = {
    threadId,
    farmerId,
    lastReadAt: new Date(0).toISOString(),
  };
  threadReadStates.push(newState);
  return newState;
};

const computeUnreadCount = (thread: ChatThread, farmerId: string) => {
  const readState = ensureReadState(thread.id, farmerId);
  const lastRead = new Date(readState.lastReadAt).getTime();
  return getThreadMessages(thread.id).filter((message) => {
    const createdAt = new Date(message.createdAt).getTime();
    return message.authorRole !== "farmer" && createdAt > lastRead;
  }).length;
};

const buildThreadSummary = (thread: ChatThread, farmerId: string): ChatThreadSummary => {
  const opportunity = getOpportunity(thread.opportunityId);
  const participants = thread.participantIds
    .map(buildParticipant)
    .filter((participant): participant is ThreadParticipant => Boolean(participant));
  const lastMessage = thread.lastMessageId
    ? messages.find((message) => message.id === thread.lastMessageId)
    : undefined;

  const summary: ChatThreadSummary = {
    ...thread,
    participants,
    opportunityTitle: opportunity.title,
    status: opportunity.status,
    unreadCount: computeUnreadCount(thread, farmerId),
  };
  if (lastMessage) {
    summary.lastMessage = lastMessage;
  }
  return summary;
};

const upsertThread = (thread: ChatThread) => {
  const index = threads.findIndex((item) => item.id === thread.id);
  if (index >= 0) {
    threads[index] = thread;
  } else {
    threads.push(thread);
  }
  ensureReadState(thread.id, thread.farmerId);
};

const createMessage = (
  thread: ChatThread,
  { authorId, authorRole, body }: PostMessageInput,
): ChatMessage => {
  const message: ChatMessage = {
    id: uuid(),
    threadId: thread.id,
    authorId,
    authorRole,
    body,
    createdAt: new Date().toISOString(),
  };
  messages.push(message);
  thread.updatedAt = message.createdAt;
  thread.lastMessageId = message.id;
  upsertThread(thread);
  return message;
};

const createThreadBase = (
  type: ThreadType,
  farmerId: string,
  opportunityId: string,
  title: string,
  participantIds: string[],
): ChatThread => {
  const now = new Date().toISOString();
  const thread: ChatThread = {
    id: uuid(),
    farmerId,
    opportunityId,
    type,
    title,
    participantIds,
    createdAt: now,
    updatedAt: now,
  };
  upsertThread(thread);
  return thread;
};

const findExistingDm = ({
  farmerId,
  applicantId,
  opportunityId,
}: {
  farmerId: string;
  applicantId: string;
  opportunityId: string;
}) =>
  threads.find(
    (thread) =>
      thread.type === "dm" &&
      thread.farmerId === farmerId &&
      thread.opportunityId === opportunityId &&
      thread.participantIds.includes(applicantId),
  );

export const chatStore = {
  listThreads: (farmerId: string, includeClosed = false): ChatThreadSummary[] => {
    return threads
      .filter((thread) => thread.farmerId === farmerId)
      .filter((thread) => {
        if (includeClosed) return true;
        const opportunity = getOpportunity(thread.opportunityId);
        return opportunity.status !== "closed";
      })
      .map((thread) => buildThreadSummary(thread, farmerId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getThreadDetail: (threadId: string, farmerId: string): ChatThreadDetail => {
    const thread = getThread(threadId);
    const summary = buildThreadSummary(thread, farmerId);
    const threadMessages = getThreadMessages(threadId);
    return {
      thread: summary,
      messages: threadMessages,
    };
  },

  createDmThread: (input: CreateDmThreadInput) => {
    const { farmerId, applicantId, opportunityId, initialMessage } = input;
    const opportunity = getOpportunity(opportunityId);
    if (opportunity.farmerId !== farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }
    getApplicant(applicantId);

    const existing = findExistingDm({ farmerId, applicantId, opportunityId });
    const thread =
      existing ??
      createThreadBase("dm", farmerId, opportunityId, "個別チャット", [
        farmerId,
        applicantId,
      ]);

    if (initialMessage) {
      createMessage(thread, {
        authorId: farmerId,
        authorRole: "farmer",
        body: initialMessage.body,
      });
    }

    return buildThreadSummary(thread, farmerId);
  },

  createGroupThread: (input: CreateGroupThreadInput) => {
    const { farmerId, opportunityId, name, participantIds } = input;
    const opportunity = getOpportunity(opportunityId);
    if (opportunity.farmerId !== farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }

    participantIds.forEach((participantId) => {
      if (participantId !== farmerId && !opportunity.participantIds.includes(participantId)) {
        throw new Error(`Participant ${participantId} is not part of the opportunity`);
      }
    });

    const thread = createThreadBase("group", farmerId, opportunityId, name, [
      farmerId,
      ...new Set(participantIds.filter((id) => id !== farmerId)),
    ]);

    return buildThreadSummary(thread, farmerId);
  },

  postMessage: (threadId: string, input: PostMessageInput, farmerId: string) => {
    const thread = getThread(threadId);
    if (thread.farmerId !== farmerId && input.authorRole === "farmer") {
      throw new Error("Farmer cannot post to threads they do not own");
    }
    const message = createMessage(thread, input);
    return {
      message,
      thread: buildThreadSummary(thread, thread.farmerId),
    };
  },

  markThreadRead: (threadId: string, input: MarkThreadReadInput) => {
    const thread = getThread(threadId);
    const readState = ensureReadState(threadId, input.farmerId);
    readState.lastReadAt = input.readAt ?? new Date().toISOString();
    return buildThreadSummary(thread, input.farmerId);
  },

  broadcastToOpportunity: (opportunityId: string, input: BroadcastMessageInput) => {
    const opportunity = getOpportunity(opportunityId);
    if (opportunity.farmerId !== input.farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }

    let thread = threads.find(
      (item) =>
        item.type === "broadcast" &&
        item.opportunityId === opportunityId &&
        item.farmerId === input.farmerId,
    );
    if (!thread) {
      thread = createThreadBase(
        "broadcast",
        input.farmerId,
        opportunityId,
        `${opportunity.title} 一斉連絡`,
        [opportunity.farmerId, ...opportunity.participantIds],
      );
    }

    const message = createMessage(thread, {
      authorId: input.farmerId,
      authorRole: "farmer",
      body: input.body,
    });

    return {
      thread: buildThreadSummary(thread, input.farmerId),
      message,
    };
  },

  listOpportunitiesWithParticipants: (farmerId: string) => {
    return opportunities
      .filter((opportunity) => opportunity.farmerId === farmerId)
      .map((opportunity) => ({
        ...opportunity,
        participants: opportunity.participantIds.map((id) => getApplicant(id)),
      }));
  },
};

