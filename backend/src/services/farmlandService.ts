import prisma from "../db/client";
import { HttpError } from "../utils/httpError";

// Prisma Clientの初期化確認
if (!prisma) {
  throw new Error("Prisma Client is not initialized");
}

export interface CreateFarmlandInput {
  farmerId: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  description?: string;
}

export interface UpdateFarmlandInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
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
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrls: input.imageUrls ? JSON.stringify(input.imageUrls) : null,
      description: input.description,
    },
  });

  // imageUrlsをJSONから配列に変換
  let parsedImageUrls = null;
  if (farmland.imageUrls) {
    try {
      parsedImageUrls = JSON.parse(farmland.imageUrls);
    } catch (error) {
      console.error(`Failed to parse imageUrls for farmland ${farmland.id}:`, error);
      parsedImageUrls = null;
    }
  }
  return {
    ...farmland,
    imageUrls: parsedImageUrls,
  };
};

export const getFarmlandsByFarmer = async (farmerId: string) => {
  try {
    // Prisma Clientの確認
    if (!prisma || !prisma.farmer) {
      console.error("Prisma Client is not properly initialized");
      throw new HttpError(500, "Database connection error");
    }

    const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
    if (!farmer) {
      throw new HttpError(404, "Farmer not found");
    }

    const farmlands = await prisma.farmland.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
    });

    // imageUrlsをJSONから配列に変換
    return farmlands.map((farmland) => {
      let parsedImageUrls: string[] | null = null;
      if (farmland.imageUrls && typeof farmland.imageUrls === "string") {
        try {
          parsedImageUrls = JSON.parse(farmland.imageUrls);
        } catch (error) {
          console.error(`Failed to parse imageUrls for farmland ${farmland.id}:`, error);
          parsedImageUrls = null;
        }
      }
      // Prismaの型とフロントエンドの型を合わせる
      return {
        ...farmland,
        imageUrls: parsedImageUrls,
        // 後方互換性のため、imageUrlも設定
        imageUrl: farmland.imageUrl,
      };
    });
  } catch (error) {
    console.error("Error in getFarmlandsByFarmer:", error);
    if (error instanceof HttpError) {
      throw error;
    }
    // Prismaエラーの場合、詳細をログに記録
    if (error && typeof error === "object" && "message" in error) {
      console.error("Prisma error details:", error);
      throw new HttpError(500, `Database error: ${(error as Error).message}`);
    }
    throw new HttpError(500, "Failed to fetch farmlands");
  }
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

  // imageUrlsをJSONから配列に変換
  let parsedImageUrls = null;
  if (farmland.imageUrls) {
    try {
      parsedImageUrls = JSON.parse(farmland.imageUrls);
    } catch (error) {
      console.error(`Failed to parse imageUrls for farmland ${farmland.id}:`, error);
      parsedImageUrls = null;
    }
  }
  return {
    ...farmland,
    imageUrls: parsedImageUrls,
  };
};

export const updateFarmland = async (
  farmlandId: string,
  farmerId: string,
  input: UpdateFarmlandInput,
) => {
  const farmland = await getFarmlandById(farmlandId, farmerId);

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.latitude !== undefined) updateData.latitude = input.latitude;
  if (input.longitude !== undefined) updateData.longitude = input.longitude;
  if (input.imageUrls !== undefined) {
    updateData.imageUrls = input.imageUrls.length > 0 ? JSON.stringify(input.imageUrls) : null;
  }
  if (input.description !== undefined) updateData.description = input.description;

  const updated = await prisma.farmland.update({
    where: { id: farmlandId },
    data: updateData,
  });

  // imageUrlsをJSONから配列に変換
  return {
    ...updated,
    imageUrls: updated.imageUrls ? JSON.parse(updated.imageUrls) : null,
  };
};

export const deleteFarmland = async (farmlandId: string, farmerId: string) => {
  const farmland = await getFarmlandById(farmlandId, farmerId);

  await prisma.farmland.delete({
    where: { id: farmlandId },
  });

  return { success: true };
};

