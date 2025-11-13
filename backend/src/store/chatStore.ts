import { prisma } from "../db/client";
import type {
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

const buildParticipant = (
  farmerId: string,
  applicantId: string | null,
  farmer: { id: string; name: string; avatarUrl: string | null; tagline: string | null } | null,
  applicant: { id: string; name: string; avatarUrl: string | null } | null,
): ThreadParticipant | null => {
  if (farmerId === farmer?.id) {
    return {
      id: farmer.id,
      role: "farmer",
      name: farmer.name,
      avatarUrl: farmer.avatarUrl ?? undefined,
      tagline: farmer.tagline ?? undefined,
    };
  }
  if (applicantId && applicant) {
    return {
      id: applicant.id,
      role: "applicant",
      name: applicant.name,
      avatarUrl: applicant.avatarUrl ?? undefined,
    };
  }
  return null;
};

const computeUnreadCount = async (threadId: string, farmerId: string): Promise<number> => {
  const readState = await prisma.threadReadState.findUnique({
    where: {
      threadId_farmerId: {
        threadId,
        farmerId,
      },
    },
  });

  const lastRead = readState ? new Date(readState.lastReadAt).getTime() : 0;

  const unreadMessages = await prisma.chatMessage.count({
    where: {
      threadId,
      authorRole: {
        not: "farmer",
      },
      createdAt: {
        gt: readState ? readState.lastReadAt : new Date(0),
      },
    },
  });

  return unreadMessages;
};

const buildThreadSummary = async (
  thread: {
    id: string;
    farmerId: string;
    opportunityId: string;
    type: string;
    title: string;
    participantIds?: string[];
    createdAt: Date;
    updatedAt: Date;
    lastMessageId: string | null;
  },
  farmerId: string,
  opportunity: { id: string; title: string; status: string },
  participants: ThreadParticipant[],
  lastMessage: ChatMessage | null,
  unreadCount: number,
): Promise<ChatThreadSummary> => {
  const summary: ChatThreadSummary = {
    id: thread.id,
    farmerId: thread.farmerId,
    opportunityId: thread.opportunityId,
    type: thread.type as ThreadType,
    title: thread.title,
    participantIds: thread.participantIds ?? [],
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastMessageId: thread.lastMessageId ?? undefined,
    participants,
    opportunityTitle: opportunity.title,
    status: opportunity.status as "open" | "in_progress" | "closed",
    unreadCount,
  };

  if (lastMessage) {
    summary.lastMessage = lastMessage;
  }

  return summary;
};

export const chatStore = {
  listThreads: async (farmerId: string, includeClosed = false): Promise<ChatThreadSummary[]> => {
    const threads = await prisma.chatThread.findMany({
      where: {
        farmerId,
        opportunity: includeClosed ? undefined : { status: { not: "closed" } },
      },
      include: {
        opportunity: true,
        participants: {
          include: {
            applicant: true,
          },
        },
        lastMessage: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    const summaries = await Promise.all(
      threads.map(async (thread) => {
        const participants: ThreadParticipant[] = [];

        // Add farmer
        if (farmer) {
          participants.push({
            id: farmer.id,
            role: "farmer",
            name: farmer.name,
            avatarUrl: farmer.avatarUrl ?? undefined,
            tagline: farmer.tagline ?? undefined,
          });
        }

        // Add applicants
        for (const participant of thread.participants) {
          if (participant.applicant) {
            participants.push({
              id: participant.applicant.id,
              role: "applicant",
              name: participant.applicant.name,
              avatarUrl: participant.applicant.avatarUrl ?? undefined,
            });
          }
        }

        const unreadCount = await computeUnreadCount(thread.id, farmerId);

        const lastMessage: ChatMessage | null = thread.lastMessage
          ? {
              id: thread.lastMessage.id,
              threadId: thread.lastMessage.threadId,
              authorId: thread.lastMessage.authorId,
              authorRole: thread.lastMessage.authorRole as "farmer" | "applicant" | "system",
              body: thread.lastMessage.body,
              createdAt: thread.lastMessage.createdAt.toISOString(),
            }
          : null;

        return buildThreadSummary(
          {
            ...thread,
            participantIds: participants.map((p) => p.id),
          },
          farmerId,
          thread.opportunity,
          participants,
          lastMessage,
          unreadCount,
        );
      }),
    );

    return summaries;
  },

  getThreadDetail: async (threadId: string, farmerId: string): Promise<ChatThreadDetail> => {
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        opportunity: true,
        participants: {
          include: {
            applicant: true,
          },
        },
        lastMessage: true,
      },
    });

    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    const participants: ThreadParticipant[] = [];

    if (farmer) {
      participants.push({
        id: farmer.id,
        role: "farmer",
        name: farmer.name,
        avatarUrl: farmer.avatarUrl ?? undefined,
        tagline: farmer.tagline ?? undefined,
      });
    }

    for (const participant of thread.participants) {
      if (participant.applicant) {
        participants.push({
          id: participant.applicant.id,
          role: "applicant",
          name: participant.applicant.name,
          avatarUrl: participant.applicant.avatarUrl ?? undefined,
        });
      }
    }

    const unreadCount = await computeUnreadCount(thread.id, farmerId);

    const lastMessage: ChatMessage | null = thread.lastMessage
      ? {
          id: thread.lastMessage.id,
          threadId: thread.lastMessage.threadId,
          authorId: thread.lastMessage.authorId,
          authorRole: thread.lastMessage.authorRole as "farmer" | "applicant" | "system",
          body: thread.lastMessage.body,
          createdAt: thread.lastMessage.createdAt.toISOString(),
        }
      : null;

    const summary = await buildThreadSummary(
      {
        ...thread,
        participantIds: participants.map((p) => p.id),
      },
      farmerId,
      thread.opportunity,
      participants,
      lastMessage,
      unreadCount,
    );

    const messages = await prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });

    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      threadId: msg.threadId,
      authorId: msg.authorId,
      authorRole: msg.authorRole as "farmer" | "applicant" | "system",
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    }));

    return {
      thread: summary,
      messages: chatMessages,
    };
  },

  createDmThread: async (input: CreateDmThreadInput) => {
    const { farmerId, applicantId, opportunityId, initialMessage } = input;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    if (opportunity.farmerId !== farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new Error(`Applicant ${applicantId} not found`);
    }

    // Check for existing DM thread
    const existingThread = await prisma.chatThread.findFirst({
      where: {
        type: "dm",
        farmerId,
        opportunityId,
        participants: {
          some: {
            applicantId,
          },
        },
      },
    });

    let thread;
    if (existingThread) {
      thread = existingThread;
    } else {
      thread = await prisma.chatThread.create({
        data: {
          farmerId,
          opportunityId,
          type: "dm",
          title: "個別チャット",
          participants: {
            create: {
              applicantId,
            },
          },
        },
      });

      // Create read state
      await prisma.threadReadState.create({
        data: {
          threadId: thread.id,
          farmerId,
          lastReadAt: new Date(0),
        },
      });
    }

    if (initialMessage) {
      const message = await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          authorId: farmerId,
          authorRole: "farmer",
          body: initialMessage.body,
        },
      });

      await prisma.chatThread.update({
        where: { id: thread.id },
        data: {
          lastMessageId: message.id,
          updatedAt: message.createdAt,
        },
      });
    }

    return this.getThreadDetail(thread.id, farmerId).then((detail) => detail.thread);
  },

  createGroupThread: async (input: CreateGroupThreadInput) => {
    const { farmerId, opportunityId, name, participantIds } = input;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        participants: true,
      },
    });

    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    if (opportunity.farmerId !== farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }

    const validApplicantIds = new Set(opportunity.participants.map((p) => p.applicantId));

    for (const participantId of participantIds) {
      if (participantId !== farmerId && !validApplicantIds.has(participantId)) {
        throw new Error(`Participant ${participantId} is not part of the opportunity`);
      }
    }

    const applicantIds = participantIds.filter((id) => id !== farmerId);

    const thread = await prisma.chatThread.create({
      data: {
        farmerId,
        opportunityId,
        type: "group",
        title: name,
        participants: {
          create: applicantIds.map((applicantId) => ({
            applicantId,
          })),
        },
      },
    });

    await prisma.threadReadState.create({
      data: {
        threadId: thread.id,
        farmerId,
        lastReadAt: new Date(0),
      },
    });

    return this.getThreadDetail(thread.id, farmerId).then((detail) => detail.thread);
  },

  postMessage: async (threadId: string, input: PostMessageInput, farmerId: string) => {
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (thread.farmerId !== farmerId && input.authorRole === "farmer") {
      throw new Error("Farmer cannot post to threads they do not own");
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        authorId: input.authorId,
        authorRole: input.authorRole,
        body: input.body,
      },
    });

    await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessageId: message.id,
        updatedAt: message.createdAt,
      },
    });

    const detail = await this.getThreadDetail(threadId, thread.farmerId);

    return {
      message: {
        id: message.id,
        threadId: message.threadId,
        authorId: message.authorId,
        authorRole: message.authorRole as "farmer" | "applicant" | "system",
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      },
      thread: detail.thread,
    };
  },

  markThreadRead: async (threadId: string, input: MarkThreadReadInput) => {
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const readAt = input.readAt ? new Date(input.readAt) : new Date();

    await prisma.threadReadState.upsert({
      where: {
        threadId_farmerId: {
          threadId,
          farmerId: input.farmerId,
        },
      },
      create: {
        threadId,
        farmerId: input.farmerId,
        lastReadAt: readAt,
      },
      update: {
        lastReadAt: readAt,
      },
    });

    const detail = await this.getThreadDetail(threadId, input.farmerId);
    return detail.thread;
  },

  broadcastToOpportunity: async (opportunityId: string, input: BroadcastMessageInput) => {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        participants: true,
      },
    });

    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    if (opportunity.farmerId !== input.farmerId) {
      throw new Error("Farmer does not own this opportunity");
    }

    let thread = await prisma.chatThread.findFirst({
      where: {
        type: "broadcast",
        opportunityId,
        farmerId: input.farmerId,
      },
    });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: {
          farmerId: input.farmerId,
          opportunityId,
          type: "broadcast",
          title: `${opportunity.title} 一斉連絡`,
          participants: {
            create: opportunity.participants.map((p) => ({
              applicantId: p.applicantId,
            })),
          },
        },
      });

      await prisma.threadReadState.create({
        data: {
          threadId: thread.id,
          farmerId: input.farmerId,
          lastReadAt: new Date(0),
        },
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        authorId: input.farmerId,
        authorRole: "farmer",
        body: input.body,
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageId: message.id,
        updatedAt: message.createdAt,
      },
    });

    const detail = await this.getThreadDetail(thread.id, input.farmerId);

    return {
      thread: detail.thread,
      message: {
        id: message.id,
        threadId: message.threadId,
        authorId: message.authorId,
        authorRole: message.authorRole as "farmer" | "applicant" | "system",
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      },
    };
  },

  listOpportunitiesWithParticipants: async (farmerId: string): Promise<Opportunity[]> => {
    const opportunities = await prisma.opportunity.findMany({
      where: { farmerId },
      include: {
        participants: {
          include: {
            applicant: true,
          },
        },
        farmland: true,
      },
    });

    return opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      status: opp.status as "open" | "in_progress" | "closed",
      startDate: opp.startDate.toISOString(),
      endDate: opp.endDate.toISOString(),
      farmName: opp.farmName,
      description: opp.description,
      farmerId: opp.farmerId,
      farmlandId: opp.farmlandId ?? undefined,
      farmland: opp.farmland ? {
        id: opp.farmland.id,
        name: opp.farmland.name,
        address: opp.farmland.address,
        prefecture: opp.farmland.prefecture,
        city: opp.farmland.city,
        imageUrl: opp.farmland.imageUrl ?? undefined,
      } : undefined,
      managingFarmerIds: [opp.farmerId], // Simplified for now
      participantIds: opp.participants.map((p) => p.applicantId),
    }));
  },
};
