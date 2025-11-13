import prisma from "../db/client";
import { HttpError } from "../utils/httpError";

export interface CreateFarmlandInput {
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

export interface UpdateFarmlandInput {
  name?: string;
  address?: string;
  prefecture?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  description?: string;
}

export const createFarmland = async (input: CreateFarmlandInput) => {
  const farmer = await prisma.farmer.findUnique({ where: { id: input.farmerId } });
  if (!farmer) {
    throw new HttpError(404, "Farmer not found");
  }

  const farmland = await prisma.farmland.create({
    data: {
      farmerId: input.farmerId,
      name: input.name,
      address: input.address,
      prefecture: input.prefecture,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl: input.imageUrl,
      description: input.description,
    },
  });

  return farmland;
};

export const getFarmlandsByFarmer = async (farmerId: string) => {
  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) {
    throw new HttpError(404, "Farmer not found");
  }

  const farmlands = await prisma.farmland.findMany({
    where: { farmerId },
    orderBy: { createdAt: "desc" },
  });

  return farmlands;
};

export const getFarmlandById = async (farmlandId: string, farmerId: string) => {
  const farmland = await prisma.farmland.findFirst({
    where: {
      id: farmlandId,
      farmerId, // 農家が所有していることを確認
    },
  });

  if (!farmland) {
    throw new HttpError(404, "Farmland not found");
  }

  return farmland;
};

export const updateFarmland = async (
  farmlandId: string,
  farmerId: string,
  input: UpdateFarmlandInput,
) => {
  const farmland = await getFarmlandById(farmlandId, farmerId);

  const updated = await prisma.farmland.update({
    where: { id: farmlandId },
    data: {
      name: input.name,
      address: input.address,
      prefecture: input.prefecture,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl: input.imageUrl,
      description: input.description,
    },
  });

  return updated;
};

export const deleteFarmland = async (farmlandId: string, farmerId: string) => {
  const farmland = await getFarmlandById(farmlandId, farmerId);

  await prisma.farmland.delete({
    where: { id: farmlandId },
  });

  return { success: true };
};

