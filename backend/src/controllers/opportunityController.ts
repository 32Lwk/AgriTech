import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export const createOpportunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      farmName,
      startDate,
      endDate,
      startTime,
      endTime,
      rewardMiles,
      farmerId,
      farmlandId,
      latitude,
      longitude,
      address,
      imageUrls,
      memo,
      farmTypes,
      interestTags,
      workstyleTags,
      tags,
      capacity,
    } = req.body;

    // バリデーション
    if (!title || !description || !farmName || !startDate || !endDate || !rewardMiles || !farmerId) {
      throw new HttpError(400, "必須項目が不足しています");
    }

    if (!farmlandId && (!latitude || !longitude)) {
      throw new HttpError(400, "実施農地を選択するか、位置情報を入力してください");
    }

    // 画像URLをJSON文字列に変換
    const imageUrlsJson = imageUrls && Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : null;

    // Opportunityを作成
    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        description,
        farmName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime || null,
        endTime: endTime || null,
        rewardMiles: parseInt(rewardMiles, 10),
        farmerId,
        farmlandId: farmlandId || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        imageUrls: imageUrlsJson,
        memo: memo || null,
        status: "open",
      },
      include: {
        farmer: true,
        farmland: true,
      },
    });

    logger.info("Opportunity created", { opportunityId: opportunity.id, farmerId });

    res.status(201).json({
      success: true,
      opportunity: {
        ...opportunity,
        imageUrls: imageUrlsJson ? JSON.parse(imageUrlsJson) : [],
      },
    });
  } catch (error) {
    logger.error("Error creating opportunity", { error });
    next(error);
  }
};

export const getOpportunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { farmerId, status } = req.query;

    const where: any = {};
    if (farmerId) {
      where.farmerId = farmerId as string;
    }
    if (status) {
      where.status = status as string;
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        farmer: true,
        farmland: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // imageUrlsをパース
    const formattedOpportunities = opportunities.map((opp) => ({
      ...opp,
      imageUrls: opp.imageUrls ? JSON.parse(opp.imageUrls) : [],
    }));

    res.json({
      success: true,
      opportunities: formattedOpportunities,
    });
  } catch (error) {
    logger.error("Error fetching opportunities", { error });
    next(error);
  }
};

export const getOpportunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { opportunityId } = req.params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        farmer: true,
        farmland: true,
      },
    });

    if (!opportunity) {
      throw new HttpError(404, "募集が見つかりませんでした");
    }

    // imageUrlsをパース
    const formattedOpportunity = {
      ...opportunity,
      imageUrls: opportunity.imageUrls ? JSON.parse(opportunity.imageUrls) : [],
    };

    res.json({
      success: true,
      opportunity: formattedOpportunity,
    });
  } catch (error) {
    logger.error("Error fetching opportunity", { error });
    next(error);
  }
};

