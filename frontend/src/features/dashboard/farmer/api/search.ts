const SEARCH_API_BASE = process.env.NEXT_PUBLIC_SEARCH_API_BASE || "http://localhost:4000/api/search";

export type SearchResult = {
  type: "message" | "opportunity";
  id: string;
  title: string;
  content: string;
  relevance?: number;
};

export type SearchResponse = {
  query: string;
  type: "all" | "messages" | "opportunities";
  results: SearchResult[];
  count: number;
};

export const searchApi = {
  search: async (
    query: string,
    options?: {
      type?: "all" | "messages" | "opportunities";
      farmerId?: string;
    },
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({
      q: query,
      ...(options?.type && { type: options.type }),
      ...(options?.farmerId && { farmerId: options.farmerId }),
    });

    const response = await fetch(`${SEARCH_API_BASE}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Search failed" }));
      throw new Error(error.message || "検索に失敗しました");
    }

    return response.json();
  },
};

