import { v4 as uuid } from "uuid";

import type {
  Applicant,
  ChatMessage,
  ChatThread,
  Farmer,
  Opportunity,
  ThreadReadState,
} from "../types/chat";

const iso = (date: Date) => date.toISOString();

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

export const farmers: Farmer[] = [
  {
    id: "farmer-001",
    name: "豊橋モデル農園",
    avatarUrl: "https://source.boringavatars.com/beam/120/farmer-001?colors=0f766e,34d399,bbf7d0",
    tagline: "季節ごとの収穫体験を提供",
  },
];

export const applicants: Applicant[] = [
  {
    id: "applicant-001",
    name: "山田 花子",
    profile: { age: 21, occupation: "大学生", location: "愛知県 名古屋市" },
    message: "農業体験は初めてですが、地域貢献がしたくて応募しました。",
    opportunityIds: ["opportunity-001"],
    avatarUrl: "https://source.boringavatars.com/beam/120/applicant-001?colors=22c55e,86efac,14532d",
  },
  {
    id: "applicant-002",
    name: "高橋 蓮",
    profile: { age: 26, occupation: "フリーランス", location: "静岡県 浜松市" },
    message: "昨年も参加しました。収穫経験があります。",
    opportunityIds: ["opportunity-002", "opportunity-004"],
    avatarUrl: "https://source.boringavatars.com/beam/120/applicant-002?colors=0ea5e9,38bdf8,bae6fd",
  },
  {
    id: "applicant-003",
    name: "李 美咲",
    profile: { age: 29, occupation: "会社員", location: "愛知県 岡崎市" },
    message: "短期で参加できる仕事を探しています。",
    opportunityIds: ["opportunity-001", "opportunity-003"],
    avatarUrl: "https://source.boringavatars.com/beam/120/applicant-003?colors=f97316,fb923c,fcd34d",
  },
  {
    id: "applicant-004",
    name: "佐藤 光",
    profile: { age: 24, occupation: "大学院生", location: "愛知県 豊橋市" },
    message: "スマート農業に興味があり、現場で学びたいです。",
    opportunityIds: ["opportunity-002"],
  },
  {
    id: "applicant-005",
    name: "中村 美沙",
    profile: { age: 31, occupation: "管理栄養士", location: "愛知県 豊川市" },
    message: "酪農の仕事に挑戦してみたいので応募しました。",
    opportunityIds: ["opportunity-003"],
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "opportunity-001",
    title: "大葉の朝収穫サポート",
    status: "open",
    startDate: iso(daysAgo(1)),
    endDate: iso(daysFromNow(6)),
    farmName: "三河香草ファーム",
    description: "大葉の収穫・選別・束ね作業のサポートを行います。",
    farmerId: "farmer-001",
    managingFarmerIds: ["farmer-001"],
    participantIds: ["applicant-001", "applicant-003"],
  },
  {
    id: "opportunity-002",
    title: "トマト誘引・芽かきチーム",
    status: "in_progress",
    startDate: iso(daysAgo(5)),
    endDate: iso(daysFromNow(2)),
    farmName: "渥美温室トマト園",
    description: "施設栽培トマトの誘引・芽かき・潅水を担当します。",
    farmerId: "farmer-001",
    managingFarmerIds: ["farmer-001"],
    participantIds: ["applicant-002", "applicant-004"],
  },
  {
    id: "opportunity-003",
    title: "キャベツ定植＆潅水チェック",
    status: "open",
    startDate: iso(daysFromNow(3)),
    endDate: iso(daysFromNow(10)),
    farmName: "高師原ベジタブル",
    description: "露地キャベツの定植と潅水ホースの確認を行います。",
    farmerId: "farmer-001",
    managingFarmerIds: ["farmer-001"],
    participantIds: ["applicant-003", "applicant-005"],
  },
  {
    id: "opportunity-004",
    title: "白ネギの収穫と根切り",
    status: "closed",
    startDate: iso(daysAgo(30)),
    endDate: iso(daysAgo(7)),
    farmName: "二川野菜カンパニー",
    description: "白ネギの収穫から選別・箱詰めまで担当します。",
    farmerId: "farmer-001",
    managingFarmerIds: ["farmer-001"],
    participantIds: ["applicant-002"],
  },
];

const dmThreads: ChatThread[] = [];
const groupThreads: ChatThread[] = [];
const messages: ChatMessage[] = [];

const addMessage = (
  thread: ChatThread,
  {
    authorId,
    authorRole,
    body,
    createdAt,
  }: { authorId: string; authorRole: ChatMessage["authorRole"]; body: string; createdAt: Date },
) => {
  const message: ChatMessage = {
    id: uuid(),
    threadId: thread.id,
    authorId,
    authorRole,
    body,
    createdAt: iso(createdAt),
  };
  messages.push(message);
  thread.lastMessageId = message.id;
  thread.updatedAt = message.createdAt;
};

const createDmThread = (applicantId: string, opportunityId: string): ChatThread => {
  const thread: ChatThread = {
    id: uuid(),
    farmerId: "farmer-001",
    opportunityId,
    type: "dm",
    title: "個別チャット",
    participantIds: ["farmer-001", applicantId],
    createdAt: iso(daysAgo(4)),
    updatedAt: iso(daysAgo(4)),
  };
  dmThreads.push(thread);
  return thread;
};

const createGroupThread = (
  opportunityId: string,
  name: string,
  participantIds: string[],
  type: ChatThread["type"] = "group",
): ChatThread => {
  const thread: ChatThread = {
    id: uuid(),
    farmerId: "farmer-001",
    opportunityId,
    type,
    title: name,
    participantIds,
    createdAt: iso(daysAgo(3)),
    updatedAt: iso(daysAgo(3)),
  };
  groupThreads.push(thread);
  return thread;
};

// Seed DM conversations
const dm1 = createDmThread("applicant-001", "opportunity-001");
addMessage(dm1, {
  authorId: "farmer-001",
  authorRole: "farmer",
  body: "ご応募ありがとうございます！集合時間は午前6時30分です。",
  createdAt: daysAgo(3),
});
addMessage(dm1, {
  authorId: "applicant-001",
  authorRole: "applicant",
  body: "了解しました。持ち物で注意することはありますか？",
  createdAt: daysAgo(3),
});
addMessage(dm1, {
  authorId: "farmer-001",
  authorRole: "farmer",
  body: "汚れても良い服装と軍手をご用意ください。",
  createdAt: daysAgo(2),
});

const dm2 = createDmThread("applicant-002", "opportunity-002");
addMessage(dm2, {
  authorId: "applicant-002",
  authorRole: "applicant",
  body: "明日の開始時間を再確認させてください。",
  createdAt: daysAgo(1),
});

const dm3 = createDmThread("applicant-003", "opportunity-003");
addMessage(dm3, {
  authorId: "farmer-001",
  authorRole: "farmer",
  body: "来週の定植作業よろしくお願いします！",
  createdAt: daysAgo(1),
});

// Seed group threads
const group1 = createGroupThread("opportunity-001", "大葉チーム全体連絡", [
  "farmer-001",
  "applicant-001",
  "applicant-003",
]);
addMessage(group1, {
  authorId: "farmer-001",
  authorRole: "farmer",
  body: "明日は5分前集合でお願いします。",
  createdAt: daysAgo(1),
});

const group2 = createGroupThread("opportunity-002", "トマトチーム全体連絡", [
  "farmer-001",
  "applicant-002",
  "applicant-004",
]);
addMessage(group2, {
  authorId: "farmer-001",
  authorRole: "farmer",
  body: "作業後にミーティングを行います。",
  createdAt: daysAgo(2),
});

const broadcastThreads = opportunities.map((opportunity) =>
  createGroupThread(
    opportunity.id,
    `${opportunity.title} 一斉連絡`,
    [opportunity.farmerId, ...opportunity.participantIds],
    "broadcast",
  ),
);

export const threads: ChatThread[] = [...dmThreads, ...groupThreads, ...broadcastThreads];

export { messages };

export const threadReadStates: ThreadReadState[] = threads.map((thread) => ({
  threadId: thread.id,
  farmerId: "farmer-001",
  lastReadAt: iso(daysAgo(5)),
}));

