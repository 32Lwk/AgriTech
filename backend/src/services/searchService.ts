import { prisma } from "../db/client";

export type SearchResult = {
  type: "message" | "opportunity";
  id: string;
  title: string;
  content: string;
  relevance?: number;
};

export const searchMessages = async (query: string, farmerId?: string): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  // Simple LIKE-based search for SQLite (FTS5 would require raw SQL)
  const messages = await prisma.chatMessage.findMany({
    where: {
      body: {
        contains: query,
      },
      thread: farmerId
        ? {
            farmerId,
          }
        : undefined,
    },
    include: {
      thread: {
        include: {
          opportunity: true,
        },
      },
    },
    take: 50,
    orderBy: {
      createdAt: "desc",
    },
  });

  return messages.map((msg) => ({
    type: "message" as const,
    id: msg.id,
    title: msg.thread.title,
    content: msg.body,
  }));
};

export const searchOpportunities = async (query: string, farmerId?: string): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      farmerId: farmerId,
      OR: [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
        {
          farmName: {
            contains: query,
          },
        },
      ],
    },
    take: 50,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return opportunities.map((opp) => ({
    type: "opportunity" as const,
    id: opp.id,
    title: opp.title,
    content: opp.description,
  }));
};

export const searchAll = async (query: string, farmerId?: string): Promise<SearchResult[]> => {
  const [messages, opportunities] = await Promise.all([
    searchMessages(query, farmerId),
    searchOpportunities(query, farmerId),
  ]);

  return [...messages, ...opportunities];
};

