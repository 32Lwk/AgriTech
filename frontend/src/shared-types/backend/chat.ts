// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Copied from backend/src/types/chat.ts via backend/scripts/sync-types.js
import { z } from "zod";

export type UserRole = "farmer" | "applicant" | "system";

export type OpportunityStatus = "open" | "in_progress" | "closed";

export type ThreadType = "dm" | "group" | "broadcast";

export interface Farmer {
  id: string;
  name: string;
  avatarUrl?: string;
  tagline?: string;
}

export interface ApplicantProfile {
  age: number;
  occupation: string;
  location: string;
}

export interface Applicant {
  id: string;
  name: string;
  profile: ApplicantProfile;
  message?: string;
  opportunityIds: string[];
  avatarUrl?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  status: OpportunityStatus;
  startDate: string;
  endDate: string;
  farmName: string;
  description: string;
  farmerId: string;
  managingFarmerIds: string[];
  participantIds: string[];
}

export interface ThreadParticipant {
  id: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  tagline?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  authorId: string;
  authorRole: UserRole;
  body: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  farmerId: string;
  opportunityId: string;
  type: ThreadType;
  title: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageId?: string;
}

export interface ChatThreadSummary extends ChatThread {
  participants: ThreadParticipant[];
  opportunityTitle: string;
  status: OpportunityStatus;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export interface ChatThreadDetail {
  thread: ChatThreadSummary;
  messages: ChatMessage[];
}

export interface ThreadReadState {
  threadId: string;
  farmerId: string;
  lastReadAt: string;
}

export const createDmThreadSchema = z.object({
  farmerId: z.string().min(1),
  applicantId: z.string().min(1),
  opportunityId: z.string().min(1),
  initialMessage: z
    .object({
      body: z.string().min(1).max(2000),
    })
    .optional(),
});

export type CreateDmThreadInput = z.infer<typeof createDmThreadSchema>;

export const createGroupThreadSchema = z.object({
  farmerId: z.string().min(1),
  opportunityId: z.string().min(1),
  name: z.string().min(1).max(80),
  participantIds: z.array(z.string().min(1)).min(1),
});

export type CreateGroupThreadInput = z.infer<typeof createGroupThreadSchema>;

export const postMessageSchema = z.object({
  authorId: z.string().min(1),
  authorRole: z.union([z.literal("farmer"), z.literal("applicant")]),
  body: z.string().min(1).max(2000),
});

export type PostMessageInput = z.infer<typeof postMessageSchema>;

export const markThreadReadSchema = z.object({
  farmerId: z.string().min(1),
  readAt: z.string().datetime().optional(),
});

export type MarkThreadReadInput = z.infer<typeof markThreadReadSchema>;

export const broadcastMessageSchema = z.object({
  farmerId: z.string().min(1),
  body: z.string().min(1).max(2000),
  includeManagers: z.boolean().optional().default(true),
});

export type BroadcastMessageInput = z.infer<typeof broadcastMessageSchema>;

export const chatQuerySchema = z.object({
  farmerId: z.string().min(1),
  includeClosed: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
});

export type ChatQueryParams = z.infer<typeof chatQuerySchema>;

