"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { FiActivity, FiMessageCircle, FiShield } from "react-icons/fi";
import { ADMIN_METRICS } from "@/mock-data/metrics";
import LeafletMap from "@/components/map/LeafletMap";
import StatCard from "@/components/ui/StatCard";
import { OPPORTUNITIES } from "@/mock-data/opportunities";
import { useAuth } from "@/features/auth/AuthContext";
import type { KycStatus } from "@/features/auth/types";
import type { OpportunityStatus } from "@/features/opportunities/types";

const KYC_BADGE: Record<KycStatus, { label: string; color: string }> = {
  unsubmitted: { label: "未提出", color: "gray" },
  pending: { label: "審査中", color: "yellow" },
  approved: { label: "承認済み", color: "green" },
  rejected: { label: "差戻し", color: "red" },
};

const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  open: "募集中",
  in_progress: "募集済み",
  closed: "完了済み",
};

const OPPORTUNITY_STATUS_COLOR: Record<OpportunityStatus, string> = {
  open: "purple",
  in_progress: "yellow",
  closed: "gray",
};

const CHAT_PREVIEW_BY_STATUS: Record<OpportunityStatus, string> = {
  open: "募集公開後の進捗確認と告知調整を実施中。",
  in_progress: "運営チームへ日程変更や人員調整の報告が届いています。",
  closed: "完了報告と次回募集の準備状況を共有しています。",
};

type AdminChatThread = {
  id: string;
  title: string;
  status: OpportunityStatus;
  statusLabel: string;
  preview: string;
  updatedAt: string;
  ownerName: string;
  ownerAvatar: string;
  ownerTagline: string;
};

type AdminChatMessage = {
  id: string;
  author: string;
  role: "admin" | "farmer";
  text: string;
  timestamp: string;
};

const buildConversation = (thread: AdminChatThread): AdminChatMessage[] => {
  switch (thread.status) {
    case "open":
      return [
        {
          id: `${thread.id}-msg-1`,
          author: "運営チーム",
          role: "admin",
          text: "募集ページの掲載内容を確認しました。応募者の質問には24時間以内に返信お願いします。",
          timestamp: "08:40",
        },
        {
          id: `${thread.id}-msg-2`,
          author: thread.ownerName,
          role: "farmer",
          text: "了解しました。FAQを更新したので反映をご確認ください。",
          timestamp: "08:53",
        },
        {
          id: `${thread.id}-msg-3`,
          author: "運営チーム",
          role: "admin",
          text: "更新を確認しました。公式SNSでも告知します。進捗はこのスレッドで共有します。",
          timestamp: "09:05",
        },
      ];
    case "in_progress":
      return [
        {
          id: `${thread.id}-msg-1`,
          author: thread.ownerName,
          role: "farmer",
          text: "本日の作業は雨天のため午後に変更しました。応募者全員に通知済みです。",
          timestamp: "06:45",
        },
        {
          id: `${thread.id}-msg-2`,
          author: "運営チーム",
          role: "admin",
          text: "了解です。アプリのスケジュールも更新しました。必要な備品があれば手配します。",
          timestamp: "06:58",
        },
        {
          id: `${thread.id}-msg-3`,
          author: thread.ownerName,
          role: "farmer",
          text: "ありがとうございます。明日の安全確認報告も共有します。",
          timestamp: "07:10",
        },
      ];
    case "closed":
    default:
      return [
        {
          id: `${thread.id}-msg-1`,
          author: "運営チーム",
          role: "admin",
          text: "募集が完了しました。参加者アンケートの回収状況を教えてください。",
          timestamp: "15:20",
        },
        {
          id: `${thread.id}-msg-2`,
          author: thread.ownerName,
          role: "farmer",
          text: "回答率は75%です。残りの方にはリマインドを送る予定です。",
          timestamp: "15:34",
        },
        {
          id: `${thread.id}-msg-3`,
          author: "運営チーム",
          role: "admin",
          text: "承知しました。次回の募集企画会議で活用します。ご協力ありがとうございました。",
          timestamp: "15:42",
        },
      ];
  }
};

export default function AdminDashboard() {
  const toast = useToast();
  const { users, updateKycStatus } = useAuth();
  const [selectedKycUser, setSelectedKycUser] = useState<string | null>(null);
  const [selectedChatOpportunityId, setSelectedChatOpportunityId] = useState<string | null>(null);

  const pendingKycUsers = useMemo(
    () => users.filter((user) => user.kycStatus === "pending"),
    [users],
  );

  const markers = useMemo(
    () =>
      OPPORTUNITIES.map((item) => ({
        id: item.id,
        position: [item.location.lat, item.location.lng] as [number, number],
        title: item.title,
        description: `${item.location.prefecture} ${item.location.city}`,
      })),
    [],
  );

  const chatThreads = useMemo<AdminChatThread[]>(() => {
    return OPPORTUNITIES.map((item, index) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      statusLabel: OPPORTUNITY_STATUS_LABEL[item.status],
      preview: CHAT_PREVIEW_BY_STATUS[item.status],
      updatedAt: `2025-05-${(index + 7).toString().padStart(2, "0")} ${
        index % 2 === 0 ? "09:00" : "13:30"
      }`,
      ownerName: item.owner.name,
      ownerAvatar: item.owner.avatarUrl,
      ownerTagline: item.owner.tagline,
    }));
  }, []);

  useEffect(() => {
    if (!selectedChatOpportunityId && chatThreads.length > 0) {
      setSelectedChatOpportunityId(chatThreads[0].id);
    }
  }, [chatThreads, selectedChatOpportunityId]);

  const activeChatThread = useMemo(() => {
    if (chatThreads.length === 0) return null;
    return (
      chatThreads.find((thread) => thread.id === selectedChatOpportunityId) ??
      chatThreads[0] ??
      null
    );
  }, [chatThreads, selectedChatOpportunityId]);

  const handleKycAction = (userId: string, status: KycStatus) => {
    updateKycStatus(userId, status);
    setSelectedKycUser(userId);
    toast({
      title: "本人確認のステータスを更新しました",
      description:
        status === "approved"
          ? "承認済みの通知を送信しました（モック演出）。"
          : status === "rejected"
            ? "差戻し通知を送信しました（モック演出）。"
            : "審査状態を更新しました。",
      status: status === "approved" ? "success" : status === "rejected" ? "error" : "info",
    });
  };

  return (
    <Stack spacing={6}>
      <Stack spacing={2}>
        <Heading size="md">運営モニタリング</Heading>
        <Text color="gray.600" fontSize="sm">
          マッチング状況と本人確認の進捗を俯瞰し、Leafletマップで各案件の分布を確認できます。
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        {ADMIN_METRICS.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            icon={<FiActivity color="#7c3aed" />}
          />
        ))}
      </SimpleGrid>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="sm">案件分布マップ</Heading>
            <HStack fontSize="xs" color="gray.500">
              <FiShield />
              <Text>Leaflet × OpenStreetMap</Text>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <LeafletMap markers={markers} height={320} zoom={5} />
        </CardBody>
      </Card>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <Heading size="sm">本人確認審査キュー</Heading>
        </CardHeader>
        <CardBody pt={0}>
          {pendingKycUsers.length === 0 ? (
            <Box borderRadius="lg" borderWidth="1px" p={6} textAlign="center">
              <Text color="gray.600" fontSize="sm">
                現在審査が必要なユーザーはいません。
              </Text>
            </Box>
          ) : (
            <Box borderRadius="lg" borderWidth="1px" overflow="hidden">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>ユーザー</Th>
                    <Th>ロール</Th>
                    <Th>所在地</Th>
                    <Th>状態</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {pendingKycUsers.map((user) => (
                    <Tr key={user.id} bg={selectedKycUser === user.id ? "purple.50" : "white"}>
                      <Td>
                        <Stack spacing={1}>
                          <Text fontWeight="semibold">{user.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            登録日: {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                          </Text>
                        </Stack>
                      </Td>
                      <Td>{user.role}</Td>
                      <Td>{user.location}</Td>
                      <Td>
                        <Badge colorScheme={KYC_BADGE[user.kycStatus].color}>
                          {KYC_BADGE[user.kycStatus].label}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            onClick={() => handleKycAction(user.id, "approved")}
                          >
                            承認
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleKycAction(user.id, "rejected")}
                          >
                            差戻し
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Alert status="info" borderRadius="xl">
        <AlertIcon />
        <Box>
          <AlertTitle>通知演出について</AlertTitle>
          <AlertDescription fontSize="sm">
            承認・差戻し操作はスナックバーで擬似通知を表示します。実際のSMS・メール送信は行われません。
          </AlertDescription>
        </Box>
      </Alert>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <Heading size="sm">案件ステータス別チャット（モック）</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <Stack spacing={3}>
              {chatThreads.map((thread) => {
                const isActive = activeChatThread?.id === thread.id;
                return (
                  <Card
                    key={thread.id}
                    variant="outline"
                    borderRadius="xl"
                    borderWidth={isActive ? "2px" : "1px"}
                    borderColor={isActive ? "purple.400" : "gray.200"}
                  >
                    <CardBody>
                      <Stack spacing={2}>
                        <HStack justify="space-between" align="center">
                          <Text fontWeight="semibold">{thread.title}</Text>
                          <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[thread.status]}>
                            {thread.statusLabel}
                          </Badge>
                        </HStack>
                        <HStack spacing={3} align="center">
                          <Avatar size="sm" name={thread.ownerName} src={thread.ownerAvatar} />
                          <Stack spacing={0}>
                            <Text fontSize="sm">{thread.ownerName}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {thread.ownerTagline}
                            </Text>
                          </Stack>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {thread.preview}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          更新: {thread.updatedAt}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="purple"
                          leftIcon={<FiMessageCircle />}
                          alignSelf="flex-start"
                          onClick={() => setSelectedChatOpportunityId(thread.id)}
                        >
                          チャットを表示
                        </Button>
                      </Stack>
                    </CardBody>
                  </Card>
                );
              })}
            </Stack>
            <Card variant="outline" borderRadius="xl">
              <CardHeader>
                <Stack spacing={2}>
                  <Heading size="sm">
                    {activeChatThread
                      ? `${activeChatThread.title} のやり取り`
                      : "案件を選択してください"}
                  </Heading>
                  {activeChatThread ? (
                    <Stack spacing={1}>
                      <HStack spacing={3} align="center">
                        <Avatar
                          size="sm"
                          name={activeChatThread.ownerName}
                          src={activeChatThread.ownerAvatar}
                        />
                        <Stack spacing={0}>
                          <Text fontSize="sm">{activeChatThread.ownerName}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {activeChatThread.ownerTagline}
                          </Text>
                        </Stack>
                      </HStack>
                      <Badge
                        colorScheme={
                          activeChatThread ? OPPORTUNITY_STATUS_COLOR[activeChatThread.status] : "gray"
                        }
                        w="fit-content"
                      >
                        {activeChatThread?.statusLabel}
                      </Badge>
                    </Stack>
                  ) : null}
                </Stack>
              </CardHeader>
              <CardBody>
                {activeChatThread ? (
                  <Stack spacing={3}>
                    {buildConversation(activeChatThread).map((message) => (
                      <Box
                        key={message.id}
                        borderRadius="lg"
                        p={3}
                        bg={message.role === "admin" ? "purple.50" : "green.50"}
                        alignSelf={message.role === "admin" ? "flex-start" : "flex-end"}
                        maxW="100%"
                      >
                        <Stack spacing={1}>
                          <Text fontSize="xs" color="gray.500">
                            {message.author}・{message.timestamp}
                          </Text>
                          <Text fontSize="sm" color="gray.800">
                            {message.text}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                    <Button
                      size="sm"
                      colorScheme="purple"
                      alignSelf="flex-end"
                      variant="outline"
                      onClick={() => toast({ title: "チャットにメモを追加しました（モック）", status: "info" })}
                    >
                      メモを追加
                    </Button>
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="gray.600">
                    案件を選択するとモックの会話が表示されます。
                  </Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <Heading size="sm">運営アクティビティログ（モック）</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <Stack spacing={3}>
            <Box borderRadius="lg" borderWidth="1px" p={4}>
              <Text fontSize="sm" fontWeight="medium">
                2025/05/01 09:12
              </Text>
              <Text fontSize="sm" color="gray.600">
                農家アカウント「信州フルーツ園」の登録を承認しました。
              </Text>
            </Box>
            <Box borderRadius="lg" borderWidth="1px" p={4}>
              <Text fontSize="sm" fontWeight="medium">
                2025/04/28 18:45
              </Text>
              <Text fontSize="sm" color="gray.600">
                労働者アカウント「山田 花子」の本人確認書類を審査中に変更しました。
              </Text>
            </Box>
            <Box borderRadius="lg" borderWidth="1px" p={4}>
              <Text fontSize="sm" fontWeight="medium">
                2025/04/27 14:05
              </Text>
              <Text fontSize="sm" color="gray.600">
                「稲刈りチーム募集」の応募者向け通知を送信しました（モック）。
              </Text>
            </Box>
          </Stack>
          <Divider my={4} />
          <Text fontSize="xs" color="gray.500">
            ログはデモ用に固定データを表示しています。実運用では監査ログや通知履歴と連携予定です。
          </Text>
        </CardBody>
      </Card>
    </Stack>
  );
}

