import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.threadReadState.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatThreadParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.opportunityParticipant.deleteMany();
  await prisma.opportunityManager.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.farmer.deleteMany();

  // Create farmer
  const farmer = await prisma.farmer.create({
    data: {
      id: "farmer-001",
      name: "豊橋モデル農園",
      avatarUrl: "https://source.boringavatars.com/beam/120/farmer-001?colors=0f766e,34d399,bbf7d0",
      tagline: "季節ごとの収穫体験を提供",
    },
  });

  // Create applicants
  const applicants = await Promise.all([
    prisma.applicant.create({
      data: {
        id: "applicant-001",
        name: "山田 花子",
        age: 21,
        occupation: "大学生",
        location: "愛知県 名古屋市",
        message: "農業体験は初めてですが、地域貢献がしたくて応募しました。",
        avatarUrl: "https://source.boringavatars.com/beam/120/applicant-001?colors=22c55e,86efac,14532d",
      },
    }),
    prisma.applicant.create({
      data: {
        id: "applicant-002",
        name: "高橋 蓮",
        age: 26,
        occupation: "フリーランス",
        location: "静岡県 浜松市",
        message: "昨年も参加しました。収穫経験があります。",
        avatarUrl: "https://source.boringavatars.com/beam/120/applicant-002?colors=0ea5e9,38bdf8,bae6fd",
      },
    }),
    prisma.applicant.create({
      data: {
        id: "applicant-003",
        name: "李 美咲",
        age: 29,
        occupation: "会社員",
        location: "愛知県 岡崎市",
        message: "短期で参加できる仕事を探しています。",
        avatarUrl: "https://source.boringavatars.com/beam/120/applicant-003?colors=f97316,fb923c,fcd34d",
      },
    }),
    prisma.applicant.create({
      data: {
        id: "applicant-004",
        name: "佐藤 光",
        age: 24,
        occupation: "大学院生",
        location: "愛知県 豊橋市",
        message: "スマート農業に興味があり、現場で学びたいです。",
      },
    }),
    prisma.applicant.create({
      data: {
        id: "applicant-005",
        name: "中村 美沙",
        age: 31,
        occupation: "管理栄養士",
        location: "愛知県 豊川市",
        message: "酪農の仕事に挑戦してみたいので応募しました。",
      },
    }),
  ]);

  // Create opportunities
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        id: "opportunity-001",
        title: "大葉の朝収穫サポート",
        status: "open",
        startDate: daysAgo(1),
        endDate: daysFromNow(6),
        farmName: "三河香草ファーム",
        description: "大葉の収穫・選別・束ね作業のサポートを行います。",
        farmerId: farmer.id,
        managingFarmers: {
          create: {
            farmerId: farmer.id,
          },
        },
        participants: {
          create: [
            { applicantId: applicants[0].id },
            { applicantId: applicants[2].id },
          ],
        },
      },
    }),
    prisma.opportunity.create({
      data: {
        id: "opportunity-002",
        title: "トマト誘引・芽かきチーム",
        status: "in_progress",
        startDate: daysAgo(5),
        endDate: daysFromNow(2),
        farmName: "渥美温室トマト園",
        description: "施設栽培トマトの誘引・芽かき・潅水を担当します。",
        farmerId: farmer.id,
        managingFarmers: {
          create: {
            farmerId: farmer.id,
          },
        },
        participants: {
          create: [
            { applicantId: applicants[1].id },
            { applicantId: applicants[3].id },
          ],
        },
      },
    }),
    prisma.opportunity.create({
      data: {
        id: "opportunity-003",
        title: "キャベツ定植＆潅水チェック",
        status: "open",
        startDate: daysFromNow(3),
        endDate: daysFromNow(10),
        farmName: "高師原ベジタブル",
        description: "露地キャベツの定植と潅水ホースの確認を行います。",
        farmerId: farmer.id,
        managingFarmers: {
          create: {
            farmerId: farmer.id,
          },
        },
        participants: {
          create: [
            { applicantId: applicants[2].id },
            { applicantId: applicants[4].id },
          ],
        },
      },
    }),
    prisma.opportunity.create({
      data: {
        id: "opportunity-004",
        title: "白ネギの収穫と根切り",
        status: "closed",
        startDate: daysAgo(30),
        endDate: daysAgo(7),
        farmName: "二川野菜カンパニー",
        description: "白ネギの収穫から選別・箱詰めまで担当します。",
        farmerId: farmer.id,
        managingFarmers: {
          create: {
            farmerId: farmer.id,
          },
        },
        participants: {
          create: [
            { applicantId: applicants[1].id },
          ],
        },
      },
    }),
  ]);

  // Create DM threads
  const dm1 = await prisma.chatThread.create({
    data: {
      id: "thread-dm-001",
      farmerId: farmer.id,
      opportunityId: opportunities[0].id,
      type: "dm",
      title: "個別チャット",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      participants: {
        create: [
          { applicantId: applicants[0].id },
        ],
      },
    },
  });

  const dm1Messages = await Promise.all([
    prisma.chatMessage.create({
      data: {
        threadId: dm1.id,
        authorId: farmer.id,
        authorRole: "farmer",
        body: "ご応募ありがとうございます！集合時間は午前6時30分です。",
        createdAt: daysAgo(3),
      },
    }),
    prisma.chatMessage.create({
      data: {
        threadId: dm1.id,
        authorId: applicants[0]!.id,
        authorRole: "applicant",
        body: "了解しました。持ち物で注意することはありますか？",
        createdAt: daysAgo(3),
      },
    }),
    prisma.chatMessage.create({
      data: {
        threadId: dm1.id,
        authorId: farmer.id,
        authorRole: "farmer",
        body: "汚れても良い服装と軍手をご用意ください。",
        createdAt: daysAgo(2),
      },
    }),
  ]);

  const lastDm1Message = dm1Messages[dm1Messages.length - 1];
  if (lastDm1Message) {
    await prisma.chatThread.update({
      where: { id: dm1.id },
      data: {
        lastMessageId: lastDm1Message.id,
        updatedAt: lastDm1Message.createdAt,
      },
    });
  }

  const dm2 = await prisma.chatThread.create({
    data: {
      id: "thread-dm-002",
      farmerId: farmer.id,
      opportunityId: opportunities[1].id,
      type: "dm",
      title: "個別チャット",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      participants: {
        create: [
          { applicantId: applicants[1].id },
        ],
      },
    },
  });

  const dm2Message = await prisma.chatMessage.create({
    data: {
      threadId: dm2.id,
      authorId: applicants[1]!.id,
      authorRole: "applicant",
      body: "明日の開始時間を再確認させてください。",
      createdAt: daysAgo(1),
    },
  });

  if (dm2Message) {
    await prisma.chatThread.update({
      where: { id: dm2.id },
      data: {
        lastMessageId: dm2Message.id,
        updatedAt: dm2Message.createdAt,
      },
    });
  }

  const dm3 = await prisma.chatThread.create({
    data: {
      id: "thread-dm-003",
      farmerId: farmer.id,
      opportunityId: opportunities[2].id,
      type: "dm",
      title: "個別チャット",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      participants: {
        create: [
          { applicantId: applicants[2].id },
        ],
      },
    },
  });

  const dm3Message = await prisma.chatMessage.create({
    data: {
      threadId: dm3.id,
      authorId: farmer.id,
      authorRole: "farmer",
      body: "来週の定植作業よろしくお願いします！",
      createdAt: daysAgo(1),
    },
  });

  await prisma.chatThread.update({
    where: { id: dm3.id },
    data: {
      lastMessageId: dm3Message.id,
      updatedAt: dm3Message.createdAt,
    },
  });

  // Create group threads
  const group1 = await prisma.chatThread.create({
    data: {
      id: "thread-group-001",
      farmerId: farmer.id,
      opportunityId: opportunities[0].id,
      type: "group",
      title: "大葉チーム全体連絡",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      participants: {
        create: [
          { applicantId: applicants[0].id },
          { applicantId: applicants[2].id },
        ],
      },
    },
  });

  const group1Message = await prisma.chatMessage.create({
    data: {
      threadId: group1.id,
      authorId: farmer.id,
      authorRole: "farmer",
      body: "明日は5分前集合でお願いします。",
      createdAt: daysAgo(1),
    },
  });

  await prisma.chatThread.update({
    where: { id: group1.id },
    data: {
      lastMessageId: group1Message.id,
      updatedAt: group1Message.createdAt,
    },
  });

  const group2 = await prisma.chatThread.create({
    data: {
      id: "thread-group-002",
      farmerId: farmer.id,
      opportunityId: opportunities[1].id,
      type: "group",
      title: "トマトチーム全体連絡",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      participants: {
        create: [
          { applicantId: applicants[1].id },
          { applicantId: applicants[3].id },
        ],
      },
    },
  });

  const group2Message = await prisma.chatMessage.create({
    data: {
      threadId: group2.id,
      authorId: farmer.id,
      authorRole: "farmer",
      body: "作業後にミーティングを行います。",
      createdAt: daysAgo(2),
    },
  });

  await prisma.chatThread.update({
    where: { id: group2.id },
    data: {
      lastMessageId: group2Message.id,
      updatedAt: group2Message.createdAt,
    },
  });

  // Create broadcast threads
  for (const opportunity of opportunities) {
    // Get participants for this opportunity
    const oppParticipants = await prisma.opportunityParticipant.findMany({
      where: { opportunityId: opportunity.id },
    });

    const broadcastThread = await prisma.chatThread.create({
      data: {
        farmerId: farmer.id,
        opportunityId: opportunity.id,
        type: "broadcast",
        title: `${opportunity.title} 一斉連絡`,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
        participants: {
          create: oppParticipants.map((p) => ({
            applicantId: p.applicantId,
          })),
        },
      },
    });

    // Create read states for all threads
    await prisma.threadReadState.create({
      data: {
        threadId: broadcastThread.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    });
  }

  // Create read states for existing threads
  await Promise.all([
    prisma.threadReadState.create({
      data: {
        threadId: dm1.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    }),
    prisma.threadReadState.create({
      data: {
        threadId: dm2.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    }),
    prisma.threadReadState.create({
      data: {
        threadId: dm3.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    }),
    prisma.threadReadState.create({
      data: {
        threadId: group1.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    }),
    prisma.threadReadState.create({
      data: {
        threadId: group2.id,
        farmerId: farmer.id,
        lastReadAt: daysAgo(5),
      },
    }),
  ]);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

