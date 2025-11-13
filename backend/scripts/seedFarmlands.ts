import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// モックデータから募集中の募集情報（簡易版）
// 実際のデータは frontend/src/mock-data/opportunities.ts を参照
const OPEN_OPPORTUNITIES = [
  { id: "op-001", title: "大葉の朝収穫サポート", farmName: "三河香草ファーム", lat: 34.6765, lng: 137.3502, farmerId: "farmer-001", description: "豊橋南部のハウスで大葉を朝に摘み取り、選別・束ね作業を担当します。" },
  { id: "op-002", title: "施設トマトの誘引・芽かき", farmName: "渥美温室トマト園", lat: 34.6942, lng: 137.3151, farmerId: "farmer-001", description: "トマトハウスで誘引や芽かき、潅水のサポートを行います。経験者歓迎。" },
  { id: "op-003", title: "キャベツの定植と潅水チェック", farmName: "高師原ベジタブル", lat: 34.7102, lng: 137.3648, farmerId: "farmer-001", description: "露地キャベツの苗を植え付け、潅水ホースの確認やマルチ張りを行います。" },
  { id: "op-006", title: "夜間ミニトマト収穫チーム", farmName: "南栄ハイテク温室", lat: 34.7008, lng: 137.3695, farmerId: "farmer-002", description: "夜に稼働するハイテク温室でミニトマトを収穫し、糖度センサーで選別します。" },
  { id: "op-007", title: "ブロッコリーの出荷準備", farmName: "杉山アグリプロジェクト", lat: 34.659689, lng: 137.344336, farmerId: "farmer-002", description: "収穫済みブロッコリーの氷詰め・箱詰め・積み込みを行う出荷ライン作業です。" },
  { id: "op-008", title: "露地ほうれん草の管理作業", farmName: "向山菜園", lat: 34.7424, lng: 137.413, farmerId: "farmer-003", description: "露地農場での除草、防虫ネット張り、収穫前の株張り確認を担当します。" },
  { id: "op-010", title: "高師原レタスの梱包ライン", farmName: "高師原アグリ協同", lat: 34.7067, lng: 137.3551, farmerId: "farmer-003", description: "採れたてレタスを冷却しながら袋詰め・ラベル貼りを行うライン作業です。" },
  { id: "op-011", title: "豊川用水の水管理補助", farmName: "西部ライスサポート", lat: 34.7825, lng: 137.3274, farmerId: "farmer-004", description: "豊川用水を利用した水田で水門開閉や水位管理、ドローン見回りを行います。" },
  { id: "op-012", title: "早生品種の田植え支援", farmName: "豊橋ふくしまライス", lat: 34.71374, lng: 137.323511, farmerId: "farmer-004", description: "乗用田植機への苗補給と畦畔の整備、苗箱洗浄などを担当します。" },
  { id: "op-013", title: "中山間の棚田管理", farmName: "石巻棚田保全会", lat: 34.739876, lng: 137.427857, farmerId: "farmer-005", description: "北部石巻地区の棚田で畦の草刈り、用水路の泥上げを行います。" },
  { id: "op-015", title: "飼料米の追肥オペレーター", farmName: "豊橋アグロサービス", lat: 34.759584, lng: 137.326405, farmerId: "farmer-005", description: "西部水田での肥料散布車の補助と散布後のスカウト記録を実施します。" },
];

// 農家IDのリスト（モックデータから）
const FARMER_IDS = [
  "farmer-001",
  "farmer-002",
  "farmer-003",
  "farmer-004",
  "farmer-005",
];

async function main() {
  console.log("農地データをシードしています...");

  // 既存の農地を削除（オプション）
  await prisma.farmland.deleteMany({});

  // 農家が存在することを確認し、存在しない場合は作成
  for (const farmerId of FARMER_IDS) {
    const existingFarmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!existingFarmer) {
      const farmerNames: Record<string, string> = {
        "farmer-001": "佐藤 大地",
        "farmer-002": "田中 美沙",
        "farmer-003": "伊藤 健司",
        "farmer-004": "山本 菜々",
        "farmer-005": "鈴木 亮介",
      };

      const farmerTaglines: Record<string, string> = {
        "farmer-001": "農場全体の段取りと調整を担当",
        "farmer-002": "新人サポートと安全管理を担当",
        "farmer-003": "肥培管理と機械整備が専門",
        "farmer-004": "収穫品質と加工工程をリード",
        "farmer-005": "出荷と配送スケジュールを最適化",
      };

      await prisma.farmer.create({
        data: {
          id: farmerId,
          name: farmerNames[farmerId] || `農家 ${farmerId}`,
          avatarUrl: `https://source.boringavatars.com/beam/120/${farmerId}?colors=0f766e,34d399,bbf7d0`,
          tagline: farmerTaglines[farmerId] || "",
        },
      });
      console.log(`農家 ${farmerId} を作成しました`);
    }
  }

  // 各農家ごとに農地を登録
  const farmlandMap = new Map<string, Set<string>>(); // 農家ID -> 農地名のセット（重複を避けるため）

  for (const opportunity of OPEN_OPPORTUNITIES) {
    const farmerId = opportunity.farmerId;

    if (!farmlandMap.has(farmerId)) {
      farmlandMap.set(farmerId, new Set());
    }

    // 農地名を生成（募集タイトルと農場名から）
    const farmlandName = `${opportunity.farmName} - ${opportunity.title}`;

    // 既に同じ農地名が登録されている場合はスキップ
    if (farmlandMap.get(farmerId)!.has(farmlandName)) {
      continue;
    }

    farmlandMap.get(farmerId)!.add(farmlandName);

    // 農地を登録
    try {
      await prisma.farmland.create({
        data: {
          farmerId,
          name: farmlandName,
          latitude: opportunity.lat,
          longitude: opportunity.lng,
          description: opportunity.description,
          imageUrls: null, // 画像は後で追加可能
        },
      });
      console.log(`農家 ${farmerId} に農地「${farmlandName}」を登録しました`);
    } catch (error) {
      console.error(`農地の登録に失敗しました: ${farmlandName}`, error);
    }
  }

  console.log("農地データのシードが完了しました！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

