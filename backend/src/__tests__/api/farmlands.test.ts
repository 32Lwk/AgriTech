import request from "supertest";
import { createApp } from "../../app";
import prisma from "../../db/client";

const app = createApp();

describe("Farmlands API", () => {
  let farmerId: string;

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.farmland.deleteMany();
    await prisma.farmer.deleteMany();
    const farmer = await prisma.farmer.create({
      data: {
        name: "Test Farmer",
        tagline: "Test tagline",
      },
    });
    farmerId = farmer.id;
  });

  afterAll(async () => {
    await prisma.farmland.deleteMany();
    await prisma.farmer.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/farmlands", () => {
    it("should create a farmland", async () => {
      const response = await request(app)
        .post("/api/farmlands")
        .send({
          farmerId,
          name: "Test Farmland",
          address: "123 Test St",
          prefecture: "Tokyo",
          city: "Shibuya",
          description: "Test description",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Farmland");
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/api/farmlands")
        .send({
          farmerId: "",
          name: "",
          address: "",
          prefecture: "",
          city: "",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/farmlands", () => {
    it("should return farmlands for a farmer", async () => {
      // Create a farmland first
      await prisma.farmland.create({
        data: {
          farmerId,
          name: "Test Farmland 2",
          address: "456 Test Ave",
          prefecture: "Osaka",
          city: "Osaka",
        },
      });

      const response = await request(app)
        .get("/api/farmlands")
        .query({ farmerId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 400 for missing farmerId", async () => {
      const response = await request(app)
        .get("/api/farmlands");

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/farmlands/:farmlandId", () => {
    let farmlandId: string;

    beforeEach(async () => {
      const farmland = await prisma.farmland.create({
        data: {
          farmerId,
          name: "Test Farmland",
          address: "123 Test St",
          prefecture: "Tokyo",
          city: "Shibuya",
        },
      });
      farmlandId = farmland.id;
    });

    it("should update a farmland", async () => {
      const response = await request(app)
        .put(`/api/farmlands/${farmlandId}`)
        .query({ farmerId })
        .send({
          name: "Updated Farmland",
          description: "Updated description",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Farmland");
      expect(response.body.description).toBe("Updated description");
    });

    it("should return 404 for non-existent farmland", async () => {
      const response = await request(app)
        .put("/api/farmlands/non-existent")
        .query({ farmerId })
        .send({
          name: "Updated Farmland",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/farmlands/:farmlandId", () => {
    let farmlandId: string;

    beforeEach(async () => {
      const farmland = await prisma.farmland.create({
        data: {
          farmerId,
          name: "Test Farmland",
          address: "123 Test St",
          prefecture: "Tokyo",
          city: "Shibuya",
        },
      });
      farmlandId = farmland.id;
    });

    it("should delete a farmland", async () => {
      const response = await request(app)
        .delete(`/api/farmlands/${farmlandId}`)
        .query({ farmerId });

      expect(response.status).toBe(204);

      // Verify it's deleted
      const farmland = await prisma.farmland.findUnique({
        where: { id: farmlandId },
      });
      expect(farmland).toBeNull();
    });
  });
});

