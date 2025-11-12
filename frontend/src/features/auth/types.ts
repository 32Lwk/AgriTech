"use client";

export type UserRole = "worker" | "farmer" | "admin";

export type GenderOption = "male" | "female" | "other" | "prefer_not_to_say";

export type KycStatus = "unsubmitted" | "pending" | "approved" | "rejected";

export type UserProfile = {
  id: string;
  email: string;
  password: string;
  name: string;
  avatarUrl: string;
  catchphrase: string;
  location: string;
  gender: GenderOption;
  age: number;
  birthDate: string;
  interests: string[];
  occupation: string;
  role: UserRole;
  kycStatus: KycStatus;
  createdAt: string;
  miles: number;
};

export type AuthSuccess = {
  success: true;
  user: UserProfile;
};

export type AuthError = {
  success: false;
  error: string;
};

export type AuthResult = AuthSuccess | AuthError;

export type RegisterPayload = Omit<
  UserProfile,
  "id" | "createdAt" | "kycStatus" | "miles"
>;

export type LoginPayload = {
  email: string;
  password: string;
};

