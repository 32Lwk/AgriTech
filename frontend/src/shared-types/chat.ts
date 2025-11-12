import type {
  Applicant,
  ApplicantProfile,
  BroadcastMessageInput,
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
  CreateDmThreadInput,
  CreateGroupThreadInput,
  MarkThreadReadInput,
  Opportunity,
  OpportunityStatus,
  ThreadParticipant,
  ThreadType,
  UserRole,
  PostMessageInput,
} from "./backend/chat";

export type {
  Applicant,
  ApplicantProfile,
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
  ThreadParticipant,
  ThreadType,
  OpportunityStatus,
  UserRole,
} from "./backend/chat";

export type CreateDmThreadPayload = CreateDmThreadInput;
export type CreateGroupThreadPayload = CreateGroupThreadInput;
export type PostMessagePayload = PostMessageInput;
export type MarkThreadReadPayload = MarkThreadReadInput;
export type BroadcastMessagePayload = BroadcastMessageInput;

export type OpportunityWithParticipants = Opportunity & {
  participants: Applicant[];
};
