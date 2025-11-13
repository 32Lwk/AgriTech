const API_BASE_URL = process.env.NEXT_PUBLIC_FARMER_CHAT_API_BASE?.replace("/api/chat", "/api/farmlands") || "http://localhost:4000/api/farmlands";

export interface Farmland {
  id: string;
  farmerId: string;
  name: string;
  address: string;
  prefecture: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmlandPayload {
  farmerId: string;
  name: string;
  address: string;
  prefecture: string;
  city: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  description?: string;
}

export interface UpdateFarmlandPayload {
  name?: string;
  address?: string;
  prefecture?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  description?: string;
}

export const farmlandsApi = {
  getFarmlands: async (farmerId: string, signal?: AbortSignal): Promise<Farmland[]> => {
    const params = new URLSearchParams({ farmerId });
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`, { signal });
    if (!response.ok) {
      throw new Error("農地一覧の取得に失敗しました");
    }
    return response.json();
  },

  getFarmland: async (farmlandId: string, farmerId: string, signal?: AbortSignal): Promise<Farmland> => {
    const params = new URLSearchParams({ farmerId });
    const response = await fetch(`${API_BASE_URL}/${farmlandId}?${params.toString()}`, { signal });
    if (!response.ok) {
      throw new Error("農地情報の取得に失敗しました");
    }
    return response.json();
  },

  createFarmland: async (payload: CreateFarmlandPayload): Promise<Farmland> => {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "農地の登録に失敗しました");
    }

    return response.json();
  },

  updateFarmland: async (farmlandId: string, farmerId: string, payload: UpdateFarmlandPayload): Promise<Farmland> => {
    const params = new URLSearchParams({ farmerId });
    const response = await fetch(`${API_BASE_URL}/${farmlandId}?${params.toString()}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "農地の更新に失敗しました");
    }

    return response.json();
  },

  deleteFarmland: async (farmlandId: string, farmerId: string): Promise<void> => {
    const params = new URLSearchParams({ farmerId });
    const response = await fetch(`${API_BASE_URL}/${farmlandId}?${params.toString()}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "農地の削除に失敗しました");
    }
  },
};

