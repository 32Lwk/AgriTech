import request from "supertest";
import { createApp } from "../../app";
import prisma from "../../db/client";

const app = createApp();

describe("Chat API", () => {
  let farmerId: string;
  let applicantId: string;
  let opportunityId: string;

  beforeAll(async () => {
    // Create test data
    const farmer = await prisma.farmer.create({
      data: {
        name: "Test Farmer",
        tagline: "Test tagline",
      },
    });
    farmerId = farmer.id;

    const applicant = await prisma.applicant.create({
      data: {
        name: "Test Applicant",
        age: 25,
        occupation: "Student",
        location: "Tokyo",
      },
    });
    applicantId = applicant.id;

    const opportunity = await prisma.opportunity.create({
      data: {
        title: "Test Opportunity",
        status: "open",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        farmName: "Test Farm",
        description: "Test description",
        farmerId: farmer.id,
      },
    });
    opportunityId = opportunity.id;
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.threadReadState.deleteMany();
    await prisma.chatThreadParticipant.deleteMany();
    await prisma.chatThread.deleteMany();
    await prisma.mileTransaction.deleteMany();
    await prisma.opportunityParticipant.deleteMany();
    await prisma.opportunityManager.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.farmland.deleteMany();
    await prisma.applicant.deleteMany();
    await prisma.farmer.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/chat/threads", () => {
    it("should return empty array when no threads exist", async () => {
      const response = await request(app)
        .get("/api/chat/threads")
        .query({ farmerId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return threads for a farmer", async () => {
      // Create a thread first
      await prisma.chatThread.create({
        data: {
          farmerId,
          opportunityId,
          type: "dm",
          title: "Test Thread",
        },
      });

      const response = await request(app)
        .get("/api/chat/threads")
        .query({ farmerId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/chat/threads/dm", () => {
    it("should create a DM thread", async () => {
      const response = await request(app)
        .post("/api/chat/threads/dm")
        .send({
          farmerId,
          applicantId,
          opportunityId,
          initialMessage: {
            body: "Hello",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.type).toBe("dm");
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/api/chat/threads/dm")
        .send({
          farmerId: "",
          applicantId,
          opportunityId,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/chat/threads/:threadId/messages", () => {
    let threadId: string;

    beforeEach(async () => {
      const thread = await prisma.chatThread.create({
        data: {
          farmerId,
          opportunityId,
          type: "dm",
          title: "Test Thread",
        },
      });
      threadId = thread.id;
    });

    it("should post a message to a thread", async () => {
      const response = await request(app)
        .post(`/api/chat/threads/${threadId}/messages`)
        .send({
          authorId: farmerId,
          authorRole: "farmer",
          body: "Test message",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message.body).toBe("Test message");
    });

    it("should return 404 for non-existent thread", async () => {
      const response = await request(app)
        .post("/api/chat/threads/non-existent/messages")
        .send({
          authorId: farmerId,
          authorRole: "farmer",
          body: "Test message",
        });

      expect(response.status).toBe(404);
    });
  });
});

