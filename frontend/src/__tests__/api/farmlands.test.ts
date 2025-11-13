import { farmlandsApi } from "@/features/dashboard/farmer/api/farmlands";

// Mock fetch
global.fetch = jest.fn();

describe("farmlandsApi", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe("getFarmlands", () => {
    it("should fetch farmlands for a farmer", async () => {
      const mockFarmlands = [
        {
          id: "1",
          farmerId: "farmer-1",
          name: "Test Farmland",
          address: "123 Test St",
          prefecture: "Tokyo",
          city: "Shibuya",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFarmlands,
      });

      const result = await farmlandsApi.getFarmlands("farmer-1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/farmlands?farmerId=farmer-1"),
        expect.any(Object),
      );
      expect(result).toEqual(mockFarmlands);
    });

    it("should throw error on failed request", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(farmlandsApi.getFarmlands("farmer-1")).rejects.toThrow();
    });
  });

  describe("createFarmland", () => {
    it("should create a farmland", async () => {
      const mockFarmland = {
        id: "1",
        farmerId: "farmer-1",
        name: "New Farmland",
        address: "456 New St",
        prefecture: "Osaka",
        city: "Osaka",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFarmland,
      });

      const result = await farmlandsApi.createFarmland({
        farmerId: "farmer-1",
        name: "New Farmland",
        address: "456 New St",
        prefecture: "Osaka",
        city: "Osaka",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/farmlands"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        }),
      );
      expect(result).toEqual(mockFarmland);
    });
  });
});

