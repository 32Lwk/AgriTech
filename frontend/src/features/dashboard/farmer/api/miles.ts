const MILE_API_BASE = process.env.NEXT_PUBLIC_MILE_API_BASE || "http://localhost:4000/api/miles";

export type MileTransactionType = "earn" | "spend" | "exchange";

export type MileTransaction = {
  id: string;
  farmerId: string;
  type: MileTransactionType;
  amount: number;
  description: string;
  opportunityId: string | null;
  createdAt: string;
};

export type MileBalance = {
  farmerId: string;
  totalMiles: number;
  transactions: MileTransaction[];
};

export type CreateMileTransactionPayload = {
  farmerId: string;
  type: MileTransactionType;
  amount: number;
  description: string;
  opportunityId?: string;
};

export const mileApi = {
  getBalance: async (farmerId: string): Promise<MileBalance> => {
    const response = await fetch(`${MILE_API_BASE}/balance/${farmerId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch balance" }));
      throw new Error(error.message || "マイル残高の取得に失敗しました");
    }

    return response.json();
  },

  getHistory: async (farmerId: string, limit = 50): Promise<MileTransaction[]> => {
    const response = await fetch(`${MILE_API_BASE}/history/${farmerId}?limit=${limit}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch history" }));
      throw new Error(error.message || "マイル履歴の取得に失敗しました");
    }

    const data = await response.json();
    return data.transactions;
  },

  createTransaction: async (payload: CreateMileTransactionPayload): Promise<MileTransaction> => {
    const response = await fetch(`${MILE_API_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create transaction" }));
      throw new Error(error.message || "マイルトランザクションの作成に失敗しました");
    }

    return response.json();
  },
};

