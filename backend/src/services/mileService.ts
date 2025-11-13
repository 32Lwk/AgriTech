import { prisma } from "../db/client";

export type MileTransactionType = "earn" | "spend" | "exchange";

export interface CreateMileTransactionInput {
  farmerId: string;
  type: MileTransactionType;
  amount: number;
  description: string;
  opportunityId?: string | undefined;
}

export interface MileTransaction {
  id: string;
  farmerId: string;
  type: MileTransactionType;
  amount: number;
  description: string;
  opportunityId: string | null;
  createdAt: string;
}

export interface MileBalance {
  farmerId: string;
  totalMiles: number;
  transactions: MileTransaction[];
}

export const calculateMileBalance = async (farmerId: string): Promise<number> => {
  const transactions = await prisma.mileTransaction.findMany({
    where: { farmerId },
  });

  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

export const createMileTransaction = async (
  input: CreateMileTransactionInput,
): Promise<MileTransaction> => {
  const transaction = await prisma.mileTransaction.create({
    data: {
      farmerId: input.farmerId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      opportunityId: input.opportunityId,
    },
  });

  return {
    id: transaction.id,
    farmerId: transaction.farmerId,
    type: transaction.type as MileTransactionType,
    amount: transaction.amount,
    description: transaction.description,
    opportunityId: transaction.opportunityId,
    createdAt: transaction.createdAt.toISOString(),
  };
};

export const getMileHistory = async (
  farmerId: string,
  limit = 50,
): Promise<MileTransaction[]> => {
  const transactions = await prisma.mileTransaction.findMany({
    where: { farmerId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map((tx) => ({
    id: tx.id,
    farmerId: tx.farmerId,
    type: tx.type as MileTransactionType,
    amount: tx.amount,
    description: tx.description,
    opportunityId: tx.opportunityId,
    createdAt: tx.createdAt.toISOString(),
  }));
};

export const getMileBalance = async (farmerId: string): Promise<MileBalance> => {
  const totalMiles = await calculateMileBalance(farmerId);
  const transactions = await getMileHistory(farmerId);

  return {
    farmerId,
    totalMiles,
    transactions,
  };
};

