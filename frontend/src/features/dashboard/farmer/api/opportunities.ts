const OPPORTUNITY_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api/opportunities";

export type CreateOpportunityPayload = {
  title: string;
  description: string;
  farmName: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  rewardMiles: number;
  farmerId: string;
  farmlandId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  imageUrls?: string[];
  memo?: string;
  farmTypes?: string[];
  interestTags?: string[];
  workstyleTags?: string[];
  tags?: string[];
  capacity?: {
    total: number;
    filled: number;
  };
};

export type Opportunity = {
  id: string;
  title: string;
  farmName: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  rewardMiles: number;
  status: string;
  farmerId: string;
  farmlandId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  imageUrls?: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
  farmer?: {
    id: string;
    name: string;
    avatarUrl?: string;
    tagline?: string;
  };
  farmland?: {
    id: string;
    name: string;
    address: string;
    prefecture: string;
    city: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    description?: string;
  };
};

export const opportunityApi = {
  createOpportunity: async (payload: CreateOpportunityPayload): Promise<Opportunity> => {
    const response = await fetch(`${OPPORTUNITY_API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create opportunity" }));
      throw new Error(error.message || "募集の作成に失敗しました");
    }

    const data = await response.json();
    return data.opportunity;
  },

  getOpportunities: async (params?: { farmerId?: string; status?: string }): Promise<Opportunity[]> => {
    const queryParams = new URLSearchParams();
    if (params?.farmerId) {
      queryParams.append("farmerId", params.farmerId);
    }
    if (params?.status) {
      queryParams.append("status", params.status);
    }

    const url = queryParams.toString()
      ? `${OPPORTUNITY_API_BASE}?${queryParams.toString()}`
      : `${OPPORTUNITY_API_BASE}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch opportunities" }));
      throw new Error(error.message || "募集の取得に失敗しました");
    }

    const data = await response.json();
    return data.opportunities;
  },

  getOpportunity: async (opportunityId: string): Promise<Opportunity> => {
    const response = await fetch(`${OPPORTUNITY_API_BASE}/${opportunityId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch opportunity" }));
      throw new Error(error.message || "募集の取得に失敗しました");
    }

    const data = await response.json();
    return data.opportunity;
  },
};

