import type {
  BroadcastMessagePayload,
  ChatThreadDetail,
  ChatThreadSummary,
  CreateDmThreadPayload,
  CreateGroupThreadPayload,
  MarkThreadReadPayload,
  OpportunityWithParticipants,
  PostMessagePayload,
} from "@/shared-types/chat";

type HttpMethod = "GET" | "POST";

const BASE_URL = process.env.NEXT_PUBLIC_FARMER_CHAT_API_BASE ?? "http://localhost:4000/api/chat";

const buildUrl = (path: string, searchParams?: Record<string, string | number | boolean>) => {
  const url = new URL(path, BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const request = async <T>(
  path: string,
  {
    method = "GET",
    body,
    searchParams,
    signal,
  }: {
    method?: HttpMethod;
    body?: unknown;
    searchParams?: Record<string, string | number | boolean>;
    signal?: AbortSignal;
  } = {},
): Promise<T> => {
  const url = buildUrl(path, searchParams);
  console.log(`[API Request] ${method} ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    console.log(`[API Response] ${method} ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] ${method} ${url} - ${response.status}: ${errorText}`);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[API Success] ${method} ${url} - Data:`, data);
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`[API Aborted] ${method} ${url}`);
      throw error;
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`[API Network Error] ${method} ${url} - Backend server may not be running`);
      throw new Error("バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。");
    }
    throw error;
  }
};

export const chatApi = {
  listThreads: async (
    farmerId: string,
    options: { includeClosed?: boolean; signal?: AbortSignal } = {},
  ): Promise<ChatThreadSummary[]> => {
    const data = await request<{ threads: ChatThreadSummary[] }>("threads", {
      searchParams: {
        farmerId,
        includeClosed: options.includeClosed ?? false,
      },
      signal: options.signal,
    });
    return data.threads;
  },

  getThreadDetail: async (
    threadId: string,
    farmerId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<ChatThreadDetail> => {
    return request<ChatThreadDetail>(`threads/${threadId}`, {
      searchParams: { farmerId },
      signal: options.signal,
    });
  },

  createDmThread: async (payload: CreateDmThreadPayload): Promise<ChatThreadSummary> => {
    return request<ChatThreadSummary>("threads/dm", {
      method: "POST",
      body: payload,
    });
  },

  createGroupThread: async (payload: CreateGroupThreadPayload): Promise<ChatThreadSummary> => {
    return request<ChatThreadSummary>("threads/group", {
      method: "POST",
      body: payload,
    });
  },

  postMessage: async (
    threadId: string,
    farmerId: string,
    payload: PostMessagePayload,
  ): Promise<{ message: ChatThreadDetail["messages"][number]; thread: ChatThreadSummary }> => {
    return request<{ message: ChatThreadDetail["messages"][number]; thread: ChatThreadSummary }>(
      `threads/${threadId}/messages`,
      {
        method: "POST",
        body: payload,
        searchParams: { farmerId },
      },
    );
  },

  markThreadRead: async (threadId: string, payload: MarkThreadReadPayload) => {
    return request<ChatThreadSummary>(`threads/${threadId}/read`, {
      method: "POST",
      body: payload,
    });
  },

  broadcastToOpportunity: async (
    opportunityId: string,
    payload: BroadcastMessagePayload,
  ): Promise<{ message: ChatThreadDetail["messages"][number]; thread: ChatThreadSummary }> => {
    return request<{ message: ChatThreadDetail["messages"][number]; thread: ChatThreadSummary }>(
      `opportunities/${opportunityId}/broadcast`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  listOpportunities: async (
    farmerId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<OpportunityWithParticipants[]> => {
    const data = await request<{ opportunities: OpportunityWithParticipants[] }>("opportunities", {
      searchParams: { farmerId },
      signal: options.signal,
    });
    return data.opportunities;
  },
};
