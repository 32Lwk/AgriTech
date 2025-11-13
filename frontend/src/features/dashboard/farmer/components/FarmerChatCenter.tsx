"use client";

import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  FiCheckCircle,
  FiFilter,
  FiMail,
  FiMessageCircle,
  FiRefreshCcw,
  FiSearch,
  FiSend,
  FiUsers,
} from "react-icons/fi";

import { chatApi } from "../api/chat";
import { uploadApi } from "../api/upload";
import type {
  BroadcastMessagePayload,
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
  CreateDmThreadPayload,
  CreateGroupThreadPayload,
  OpportunityStatus,
  OpportunityWithParticipants,
  ThreadParticipant,
  ThreadType,
} from "@/shared-types/chat";

type ThreadCategory = "all" | ThreadType;

type FarmerChatCenterProps = {
  farmerId: string;
  farmerDisplayName: string;
  focusSignal?: { id: string; nonce: number } | null;
  onUnreadChange?: (count: number) => void;
};

type ComposedThread = ChatThreadSummary & {
  opportunityLabel: string;
};

type ThreadModalState = {
  opportunityId: string;
  applicantId?: string;
  participantIds: string[];
  messageBody: string;
  groupName: string;
};

type OpportunityThreadGroup = {
  opportunityId: string;
  opportunityTitle: string;
  status: OpportunityStatus;
  threadsByType: Record<ThreadType, ComposedThread[]>;
  latestUpdatedAt: number;
};

const DEFAULT_MODAL_STATE: ThreadModalState = {
  opportunityId: "",
  applicantId: undefined,
  participantIds: [],
  messageBody: "",
  groupName: "",
};

const THREAD_CATEGORY_LABEL: Record<ThreadCategory, string> = {
  all: "すべて",
  dm: "DM",
  group: "グループ",
  broadcast: "一斉連絡",
};

const OPPORTUNITY_STATUS_COLOR: Record<OpportunityStatus, string> = {
  open: "green",
  in_progress: "yellow",
  closed: "gray",
};

const THREAD_TYPE_ORDER: readonly ThreadType[] = ["dm", "group", "broadcast"] as const;

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${month}月${day}日 ${hour}:${minute}`;
};

const getThreadBadgeColor = (type: ThreadType) => {
  switch (type) {
    case "dm":
      return "teal";
    case "group":
      return "purple";
    case "broadcast":
      return "orange";
    default:
      return "gray";
  }
};

const useLatestRef = <T,>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const enhanceThreadSummary = (thread: ChatThreadSummary): ComposedThread => ({
  ...thread,
  opportunityLabel: thread.opportunityTitle,
});

export const FarmerChatCenter = ({
  farmerId,
  farmerDisplayName,
  focusSignal,
  onUnreadChange,
}: FarmerChatCenterProps) => {
  console.log(`[FarmerChatCenter] Initialized with farmerId: ${farmerId}, farmerDisplayName: ${farmerDisplayName}`);
  const toast = useToast();
  const dmModal = useDisclosure();
  const groupModal = useDisclosure();
  const broadcastModal = useDisclosure();
  const socket = useSocket();

  const [threads, setThreads] = useState<ComposedThread[]>([]);
  const [threadCategory, setThreadCategory] = useState<ThreadCategory>("all");
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState<string>("active");
  const [includeClosed, setIncludeClosed] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ChatThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [opportunities, setOpportunities] = useState<OpportunityWithParticipants[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [dmState, setDmState] = useState<ThreadModalState>(DEFAULT_MODAL_STATE);
  const [groupState, setGroupState] = useState<ThreadModalState>(DEFAULT_MODAL_STATE);
  const [broadcastState, setBroadcastState] = useState<ThreadModalState>(DEFAULT_MODAL_STATE);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [chatSearchKeyword, setChatSearchKeyword] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; originalName: string }>>([]);

  const threadsRef = useLatestRef(threads);

  const activeOpportunityIds = useMemo(() => {
    return opportunities
      .filter((item) => item.status !== "closed")
      .map((item) => item.id);
  }, [opportunities]);

  const normalizedKeyword = useMemo(() => chatSearchKeyword.trim().toLowerCase(), [chatSearchKeyword]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      if (threadCategory !== "all" && thread.type !== threadCategory) {
        return false;
      }
      if (selectedOpportunityFilter === "active") {
        return activeOpportunityIds.includes(thread.opportunityId);
      }
      if (selectedOpportunityFilter === "all") {
        return true;
      }
      if (thread.opportunityId !== selectedOpportunityFilter) {
        return false;
      }
      return true;
    }).filter((thread) => {
      if (!normalizedKeyword) return true;
      const haystack = [
        thread.opportunityLabel,
        THREAD_CATEGORY_LABEL[thread.type],
        thread.participants.map((participant) => participant.name).join(" "),
        thread.lastMessage?.body ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [threads, threadCategory, selectedOpportunityFilter, activeOpportunityIds, normalizedKeyword]);

  const opportunityThreadGroups = useMemo(() => {
    const map = new Map<string, OpportunityThreadGroup>();

    filteredThreads.forEach((thread) => {
      let bucket = map.get(thread.opportunityId);
      if (!bucket) {
        bucket = {
          opportunityId: thread.opportunityId,
          opportunityTitle: thread.opportunityLabel,
          status: thread.status,
          threadsByType: {
            dm: [],
            group: [],
            broadcast: [],
          },
          latestUpdatedAt: 0,
        };
        map.set(thread.opportunityId, bucket);
      }
      bucket.threadsByType[thread.type].push(thread);
      bucket.latestUpdatedAt = Math.max(
        bucket.latestUpdatedAt,
        new Date(thread.updatedAt).getTime(),
      );
    });

    return Array.from(map.values())
      .map((bucket) => {
        const sortedByType: Record<ThreadType, ComposedThread[]> = {
          dm: [...bucket.threadsByType.dm].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
          group: [...bucket.threadsByType.group].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
          broadcast: [...bucket.threadsByType.broadcast].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        };

        return {
          ...bucket,
          threadsByType: sortedByType,
        };
      })
      .sort((a, b) => b.latestUpdatedAt - a.latestUpdatedAt);
  }, [filteredThreads]);

  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return filteredThreads.find((thread) => thread.id === activeThreadId) ?? null;
  }, [filteredThreads, activeThreadId]);

  const activeMessages = threadDetail?.messages ?? [];

  const selectedOpportunityForDm = opportunities.find((item) => item.id === dmState.opportunityId);
  const selectedOpportunityForGroup = opportunities.find((item) => item.id === groupState.opportunityId);
  const selectedOpportunityForBroadcast = opportunities.find(
    (item) => item.id === broadcastState.opportunityId,
  );

  const resetModals = () => {
    setDmState(DEFAULT_MODAL_STATE);
    setGroupState(DEFAULT_MODAL_STATE);
    setBroadcastState(DEFAULT_MODAL_STATE);
  };

  const fetchThreads = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}) => {
      if (!farmerId) {
        console.warn("[fetchThreads] farmerId is not set");
        return;
      }
      console.log(`[fetchThreads] Starting fetch for farmerId: ${farmerId}`);
      setLoadingThreads(true);
      try {
        const data = await chatApi.listThreads(farmerId, {
          includeClosed,
          signal,
        });
        console.log(`[fetchThreads] Received ${data?.length || 0} threads`);
        const composed: ComposedThread[] = (data || []).map(enhanceThreadSummary);
        setThreads(composed);
        if (composed.length > 0) {
          const current = threadsRef.current.find((item) => item.id === activeThreadId);
          const nextActive = current ? current.id : composed[0].id;
          setActiveThreadId((prev) => prev ?? nextActive);
        } else {
          setActiveThreadId(null);
        }
      } catch (error) {
        // AbortErrorはReact StrictModeによる二重マウントによる正常な動作なので無視
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[fetchThreads] Request aborted (normal in development)");
          return;
        }
        console.error("[fetchThreads] Error:", error);
        toast({
          title: "チャットスレッドの取得に失敗しました",
          description: error instanceof Error ? error.message : "不明なエラーが発生しました",
          status: "error",
          duration: 5000,
        });
      } finally {
        setLoadingThreads(false);
      }
    },
    [farmerId, includeClosed, toast, activeThreadId, threadsRef],
  );

  const fetchOpportunities = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}) => {
      if (!farmerId) {
        console.warn("[fetchOpportunities] farmerId is not set");
        return;
      }
      console.log(`[fetchOpportunities] Starting fetch for farmerId: ${farmerId}`);
      setLoadingOpportunities(true);
      try {
        const data = await chatApi.listOpportunities(farmerId, { signal });
        console.log(`[fetchOpportunities] Received ${data?.length || 0} opportunities`);
        setOpportunities(data || []);
      } catch (error) {
        // AbortErrorはReact StrictModeによる二重マウントによる正常な動作なので無視
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[fetchOpportunities] Request aborted (normal in development)");
          return;
        }
        console.error("[fetchOpportunities] Error:", error);
        toast({ 
          title: "案件情報の取得に失敗しました",
          description: error instanceof Error ? error.message : "不明なエラーが発生しました",
          status: "error",
          duration: 5000,
        });
        setOpportunities([]); // エラー時は空配列を設定
      } finally {
        setLoadingOpportunities(false);
      }
    },
    [farmerId, toast],
  );

  const fetchThreadDetail = useCallback(
    async (threadId: string) => {
      if (!farmerId) return;
      setLoadingDetail(true);
      try {
        const detail = await chatApi.getThreadDetail(threadId, farmerId);
        setThreadDetail(detail);
        // 既読マークは失敗しても続行（非同期で実行）
        chatApi.markThreadRead(threadId, { farmerId }).catch((error) => {
          console.warn("Failed to mark thread as read:", error);
          // エラーを無視（既読マークの失敗は致命的ではない）
        });
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === detail.thread.id ? { ...thread, unreadCount: 0 } : thread,
          ),
        );
      } catch (error) {
        console.error(error);
        toast({ title: "チャット詳細の取得に失敗しました", status: "error" });
      } finally {
        setLoadingDetail(false);
      }
    },
    [farmerId, toast],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchThreads({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchThreads]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOpportunities({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchOpportunities]);

  useEffect(() => {
    if (activeThreadId) {
      fetchThreadDetail(activeThreadId);
    } else {
      setThreadDetail(null);
    }
  }, [activeThreadId, fetchThreadDetail]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setThreads((prev) => {
        const thread = prev.find((t) => t.id === message.threadId);
        if (!thread) {
          // Thread not in list, refresh threads
          fetchThreads();
          return prev;
        }
        return prev.map((t) =>
          t.id === message.threadId
            ? {
                ...t,
                lastMessage: message,
                updatedAt: message.createdAt,
                unreadCount: t.id === activeThreadId ? 0 : t.unreadCount + 1,
              }
            : t,
        );
      });

      // Update thread detail if active
      if (message.threadId === activeThreadId && threadDetail) {
        setThreadDetail((prev) => {
          if (!prev || prev.thread.id !== message.threadId) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message],
            thread: {
              ...prev.thread,
              lastMessage: message,
              updatedAt: message.createdAt,
            },
          };
        });
      }
    };

    const handleThreadUpdate = (updatedThread: ChatThreadSummary) => {
      setThreads((prev) => {
        const existing = prev.find((t) => t.id === updatedThread.id);
        if (!existing) {
          // New thread, refresh list
          fetchThreads();
          return prev;
        }
        return prev.map((t) =>
          t.id === updatedThread.id ? enhanceThreadSummary(updatedThread) : t,
        );
      });

      // Update thread detail if active
      if (updatedThread.id === activeThreadId) {
        fetchThreadDetail(updatedThread.id);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("thread:update", handleThreadUpdate);

    // Join all thread rooms
    threads.forEach((thread) => {
      socket.emit("join:thread", thread.id);
    });

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("thread:update", handleThreadUpdate);
      // Leave all thread rooms
      threads.forEach((thread) => {
        socket.emit("leave:thread", thread.id);
      });
    };
  }, [socket, threads, activeThreadId, threadDetail, fetchThreads, fetchThreadDetail]);

  useEffect(() => {
    if (focusSignal?.id) {
      setSelectedOpportunityFilter(focusSignal.id);
    }
  }, [focusSignal]);

  useEffect(() => {
    if (onUnreadChange) {
      const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
      onUnreadChange(unread);
    }
  }, [threads, onUnreadChange]);

  const handleRefresh = async () => {
    setSyncing(true);
    await Promise.all([fetchThreads(), fetchOpportunities()]);
    setSyncing(false);
    toast({ title: "最新状態を取得しました", status: "success", duration: 1500 });
  };

  const handleSendMessage = async (body: string) => {
    if (!activeThread || !body.trim()) return;
    setSendingMessage(true);
    try {
      const response = await chatApi.postMessage(activeThread.id, farmerId, {
        authorId: farmerId,
        authorRole: "farmer",
        body: body.trim(),
      });
      setThreadDetail((prev) =>
        prev
          ? {
              thread: response.thread,
              messages: [...prev.messages, response.message],
            }
          : prev,
      );
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === response.thread.id ? enhanceThreadSummary(response.thread) : thread,
        ),
      );
      setDraftMessage("");
      setUploadedFiles([]);
      toast({ title: "メッセージを送信しました", status: "success", duration: 1500 });
    } catch (error) {
      console.error(error);
      toast({ title: "メッセージの送信に失敗しました", status: "error" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateDm = async () => {
    if (!dmState.opportunityId || !dmState.applicantId) {
      toast({ title: "案件と応募者を選択してください", status: "warning" });
      return;
    }
    try {
      const payload: CreateDmThreadPayload = {
        farmerId,
        opportunityId: dmState.opportunityId,
        applicantId: dmState.applicantId,
        initialMessage:
          dmState.messageBody.trim().length > 0
            ? {
                body: dmState.messageBody.trim(),
              }
            : undefined,
      };
      const thread = await chatApi.createDmThread(payload);
      const composedThread = enhanceThreadSummary(thread);
      dmModal.onClose();
      setThreads((prev) => {
        const next = [
          composedThread,
          ...prev.filter((item) => item.id !== composedThread.id),
        ];
        return next;
      });
      setActiveThreadId(composedThread.id);
      setDmState(DEFAULT_MODAL_STATE);
      toast({ title: "DMスレッドを作成しました", status: "success" });
    } catch (error) {
      console.error(error);
      toast({ title: "DMの作成に失敗しました", status: "error" });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupState.opportunityId || groupState.participantIds.length === 0) {
      toast({ title: "案件とメンバーを選択してください", status: "warning" });
      return;
    }
    if (!groupState.groupName.trim()) {
      toast({ title: "グループ名を入力してください", status: "warning" });
      return;
    }
    try {
      const payload: CreateGroupThreadPayload = {
        farmerId,
        opportunityId: groupState.opportunityId,
        name: groupState.groupName.trim(),
        participantIds: groupState.participantIds,
      };
      const thread = await chatApi.createGroupThread(payload);
      const composedThread = enhanceThreadSummary(thread);
      groupModal.onClose();
      setThreads((prev) => [composedThread, ...prev.filter((item) => item.id !== composedThread.id)]);
      setActiveThreadId(composedThread.id);
      setGroupState(DEFAULT_MODAL_STATE);
      toast({ title: "グループスレッドを作成しました", status: "success" });
    } catch (error) {
      console.error(error);
      toast({ title: "グループ作成に失敗しました", status: "error" });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastState.opportunityId || !broadcastState.messageBody.trim()) {
      toast({ title: "案件とメッセージを確認してください", status: "warning" });
      return;
    }
    try {
      const payload: BroadcastMessagePayload = {
        farmerId,
        body: broadcastState.messageBody.trim(),
        includeManagers: true,
      };
      const response = await chatApi.broadcastToOpportunity(broadcastState.opportunityId, payload);
      broadcastModal.onClose();
      setThreads((prev) => {
        const nextThread = enhanceThreadSummary(response.thread);
        const others = prev.filter((thread) => thread.id !== nextThread.id);
        return [nextThread, ...others];
      });
      setThreadDetail((prev) =>
        prev && prev.thread.id === response.thread.id
          ? { thread: response.thread, messages: [...prev.messages, response.message] }
          : prev,
      );
      setBroadcastState(DEFAULT_MODAL_STATE);
      toast({ title: "一斉連絡を送信しました", status: "success" });
    } catch (error) {
      console.error(error);
      toast({ title: "一斉連絡の送信に失敗しました", status: "error" });
    }
  };

  const handleThreadSelect = (thread: ComposedThread) => {
    setActiveThreadId(thread.id);
  };

  const currentRecipients = useMemo(() => {
    if (!activeThread) return [] as ThreadParticipant[];
    return activeThread.participants.filter((participant) => participant.role !== "farmer");
  }, [activeThread]);

  const [draftMessage, setDraftMessage] = useState("");
  useEffect(() => {
    setDraftMessage("");
  }, [activeThreadId]);

  const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftMessage.trim()) {
      toast({ title: "メッセージを入力してください", status: "warning" });
      return;
    }
    void handleSendMessage(draftMessage);
  };

  return (
    <Stack spacing={4} align="stretch">
      <Stack spacing={3} direction={{ base: "column", lg: "row" }} justify="space-between">
        <Stack direction={{ base: "column", md: "row" }} spacing={2} align="center">
          <Select
            maxW={{ base: "100%", md: 60 }}
            value={selectedOpportunityFilter}
            onChange={(event) => setSelectedOpportunityFilter(event.target.value)}
          >
            <option value="active">開催中の案件</option>
            <option value="all">すべての案件</option>
            {opportunities?.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.title}
              </option>
            ))}
          </Select>
          <ButtonGroup size="sm" isAttached variant="outline">
            {(Object.keys(THREAD_CATEGORY_LABEL) as ThreadCategory[]).map((category) => (
              <Button
                key={category}
                onClick={() => setThreadCategory(category)}
                colorScheme={threadCategory === category ? "teal" : undefined}
              >
                {THREAD_CATEGORY_LABEL[category]}
              </Button>
            ))}
          </ButtonGroup>
          <HStack spacing={2} align="center">
            <Switch
              isChecked={includeClosed}
              onChange={(event) => setIncludeClosed(event.target.checked)}
            />
            <Text fontSize="sm">完了案件を含める</Text>
          </HStack>
        </Stack>
        <HStack spacing={2} justify="flex-end">
          <Tooltip label="最新の状態を取得">
            <IconButton
              aria-label="最新取得"
              icon={syncing ? <Spinner size="sm" /> : <FiRefreshCcw />}
              onClick={handleRefresh}
              variant="outline"
            />
          </Tooltip>
          <Button leftIcon={<FiMail />} colorScheme="teal" variant="outline" onClick={dmModal.onOpen}>
            応募者へDM
          </Button>
          <Button
            leftIcon={<FiUsers />}
            colorScheme="purple"
            variant="outline"
            onClick={groupModal.onOpen}
          >
            グループ作成
          </Button>
          <Button
            leftIcon={<FiSend />}
            colorScheme="orange"
            variant="solid"
            onClick={broadcastModal.onOpen}
          >
            一斉連絡
          </Button>
        </HStack>
      </Stack>
      <Grid templateColumns={{ base: "1fr", lg: "minmax(280px, 0.33fr) minmax(0, 0.67fr)" }} gap={4}>
        <Card variant="outline" borderRadius="xl" h="100%">
          <CardHeader pb={2}>
            <HStack justify="space-between" align="center">
              <Heading size="sm">スレッド一覧</Heading>
              {loadingThreads ? <Spinner size="sm" /> : null}
            </HStack>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  value={chatSearchKeyword}
                  onChange={(event) => setChatSearchKeyword(event.target.value)}
                  placeholder="キーワードで絞り込み"
                  bg="white"
                />
              </InputGroup>
              {opportunityThreadGroups.length === 0 ? (
                <Stack
                  spacing={3}
                  py={10}
                  px={6}
                  color="gray.500"
                  textAlign="center"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                >
                  <FiMessageCircle size={32} style={{ margin: "0 auto" }} />
                  <Text fontWeight="semibold">該当するスレッドがありません</Text>
                  <Text fontSize="sm">条件を変更するか、新しく会話を開始してください。</Text>
                  {threads.length > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="teal"
                      onClick={() => {
                        setThreadCategory("all");
                        setSelectedOpportunityFilter("active");
                        setIncludeClosed(false);
                        setChatSearchKeyword("");
                      }}
                    >
                      設定をリセット
                    </Button>
                  ) : null}
                </Stack>
              ) : (
                <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
                  {opportunityThreadGroups.map((bucket) => {
                    const { dm, group, broadcast } = bucket.threadsByType;
                    const broadcastCount = broadcast.length > 0 ? 1 : 0;
                    const totalThreads = dm.length + group.length + broadcastCount;
                    return (
                      <AccordionItem key={bucket.opportunityId} border="none">
                        <AccordionButton
                          px={3}
                          py={3}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="gray.200"
                          transition="all 0.2s"
                          _expanded={{ bg: "teal.50", borderColor: "teal.400", boxShadow: "md" }}
                          _hover={{ borderColor: "teal.400" }}
                        >
                          <HStack w="full" align="center" justify="space-between">
                            <Text fontSize="sm" fontWeight="semibold">
                              {bucket.opportunityTitle}
                            </Text>
                            <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[bucket.status]} borderRadius="full" px={2}>
                              {totalThreads} 件
                            </Badge>
                          </HStack>
                        </AccordionButton>
                        <AccordionPanel pt={3} pb={4} px={0}>
                          <Stack spacing={4}>
                            {THREAD_TYPE_ORDER.map((type) => {
                              const list = bucket.threadsByType[type];
                              if (!list || list.length === 0) return null;
                              const uniqueList =
                                type === "broadcast" && list.length > 1 ? [list[0]] : list;
                              return (
                                <Stack key={`${bucket.opportunityId}-${type}`} spacing={2}>
                                  <HStack justify="space-between" align="center">
                                    <HStack spacing={2} align="center">
                                      <Badge colorScheme={getThreadBadgeColor(type)}>
                                        {THREAD_CATEGORY_LABEL[type]}
                                      </Badge>
                                      <Text fontSize="xs" color="gray.500">
                                        {list.length} 件
                                      </Text>
                                    </HStack>
                                  </HStack>
                                  <Stack spacing={2}>
                                    {uniqueList.map((thread) => {
                                      const isActive = activeThreadId === thread.id;
                                      const recipientNames = thread.participants
                                        .filter((participant) => participant.role !== "farmer")
                                        .map((participant) => participant.name)
                                        .join(" / ");
                                      const previewText =
                                        thread.lastMessage?.body ?? "メッセージはまだありません";
                                      return (
                                        <Box
                                          key={thread.id}
                                          as="button"
                                          type="button"
                                          onClick={() => handleThreadSelect(thread)}
                                          borderWidth="1px"
                                          borderColor={isActive ? "teal.400" : "gray.200"}
                                          bg={isActive ? "teal.50" : "white"}
                                          borderRadius="lg"
                                          px={3}
                                          py={3}
                                          textAlign="left"
                                          transition="all 0.2s"
                                          _hover={{ borderColor: "teal.400" }}
                                        >
                                          <Stack spacing={1}>
                                            <HStack justify="space-between" align="center">
                                              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                                {recipientNames || thread.title}
                                              </Text>
                                              <HStack spacing={2}>
                                                {thread.unreadCount > 0 ? (
                                                  <Badge colorScheme="red" borderRadius="full" px={2}>
                                                    未読 {thread.unreadCount}
                                                  </Badge>
                                                ) : (
                                                  <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2}>
                                                    既読
                                                  </Badge>
                                                )}
                                              </HStack>
                                            </HStack>
                                            <Wrap spacing={2} shouldWrapChildren>
                                              {thread.participants
                                                .filter((participant) => participant.role !== "farmer")
                                                .map((participant) => (
                                                  <WrapItem key={`${thread.id}-${participant.id}`}>
                                                    <HStack
                                                      spacing={1}
                                                      bg="gray.100"
                                                      borderRadius="full"
                                                      px={2}
                                                      py={1}
                                                    >
                                                      <Avatar
                                                        size="xs"
                                                        name={participant.name}
                                                        src={participant.avatarUrl}
                                                      />
                                                      <Text fontSize="xs">{participant.name}</Text>
                                                    </HStack>
                                                  </WrapItem>
                                                ))}
                                            </Wrap>
                                            <Text fontSize="xs" color="gray.500">
                                              {formatDateTime(thread.updatedAt)}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                              {previewText}
                                            </Text>
                                          </Stack>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                </Stack>
                              );
                            })}
                          </Stack>
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </Stack>
          </CardBody>
        </Card>
        <Card variant="outline" borderRadius="xl" h="100%">
          <CardHeader>
            {activeThread ? (
              <Stack spacing={2}>
                <Heading size="sm">{activeThread.title}</Heading>
                <Text fontSize="xs" color="gray.500">
                  {activeThread.opportunityLabel}｜更新 {formatDateTime(activeThread.updatedAt)}
                </Text>
                <Wrap spacing={2} shouldWrapChildren>
                  {currentRecipients.length > 0 ? (
                    currentRecipients.map((participant) => (
                      <WrapItem key={participant.id}>
                        <HStack spacing={1} bg="teal.50" borderRadius="full" px={3} py={1}>
                          <Avatar size="xs" name={participant.name} src={participant.avatarUrl} />
                          <Text fontSize="xs">{participant.name}</Text>
                        </HStack>
                      </WrapItem>
                    ))
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      参加者情報がありません
                    </Text>
                  )}
                </Wrap>
              </Stack>
            ) : (
              <Heading size="sm">スレッドを選択してください</Heading>
            )}
          </CardHeader>
          <CardBody height="100%" display="flex" flexDirection="column">
            {loadingDetail ? (
              <Flex align="center" justify="center" flex="1" minH="40vh">
                <Spinner />
              </Flex>
            ) : activeThread && threadDetail ? (
              <Stack spacing={4} flex="1" minH={{ base: "45vh", lg: "60vh" }}>
                <Box flex="1" overflowY="auto" pr={1}>
                  <Stack spacing={3}>
                    {activeMessages.map((message: ChatMessage) => {
                      const isFarmer = message.authorRole === "farmer";
                      return (
                        <Box
                          key={message.id}
                          borderRadius="lg"
                          p={3}
                          bg={isFarmer ? "green.50" : "gray.100"}
                          alignSelf={isFarmer ? "flex-end" : "flex-start"}
                          maxW={{ base: "100%", md: "75%" }}
                        >
                          <Stack spacing={1}>
                            <HStack spacing={2} align="center">
                              <Badge colorScheme={isFarmer ? "green" : "gray"}>
                                {isFarmer ? farmerDisplayName : "応募者"}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                {formatDateTime(message.createdAt)}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.800">
                              {message.body}
                            </Text>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
                <Divider />
                <Box as="form" onSubmit={handleMessageSubmit}>
                  <Stack spacing={2}>
                    {uploadedFiles.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>
                          アップロード済みファイル:
                        </Text>
                        <Wrap spacing={2}>
                          {uploadedFiles.map((file, index) => (
                            <WrapItem key={index}>
                              <Badge colorScheme="blue">
                                {file.originalName}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    <Textarea
                      placeholder="メッセージを入力してください"
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      resize="vertical"
                      minH="120px"
                    />
                    <HStack justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          display="none"
                          id="file-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingFile(true);
                            try {
                              const uploaded = await uploadApi.uploadFile(file);
                              setUploadedFiles((prev) => [...prev, { url: uploaded.url, originalName: uploaded.originalName }]);
                              setDraftMessage((prev) => 
                                prev ? `${prev}\n[ファイル: ${uploaded.originalName}](${uploaded.url})` : `[ファイル: ${uploaded.originalName}](${uploaded.url})`
                              );
                              toast({ title: "ファイルをアップロードしました", status: "success" });
                            } catch (error) {
                              console.error(error);
                              toast({ title: "ファイルのアップロードに失敗しました", status: "error" });
                            } finally {
                              setUploadingFile(false);
                              // Reset input
                              e.target.value = "";
                            }
                          }}
                        />
                        <Button
                          as="label"
                          htmlFor="file-upload"
                          size="sm"
                          variant="outline"
                          isLoading={uploadingFile}
                          cursor="pointer"
                        >
                          ファイル添付
                        </Button>
                        <Text fontSize="xs" color="gray.500">
                          Enterで改行・Ctrl+Enterで送信
                        </Text>
                      </HStack>
                      <Button
                        type="submit"
                        colorScheme="green"
                        rightIcon={<FiSend />}
                        isLoading={sendingMessage}
                        isDisabled={!draftMessage.trim() && uploadedFiles.length === 0}
                      >
                        送信
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Flex
                align="center"
                justify="center"
                flex="1"
                minH={{ base: "45vh", lg: "60vh" }}
              >
                <Stack spacing={3} align="center" color="gray.500">
                  <FiFilter size={32} />
                  <Text fontWeight="semibold">スレッドを選択すると会話が表示されます</Text>
                  <Text fontSize="sm">左のリストから会話を選択するか、新しく作成してください。</Text>
                </Stack>
              </Flex>
            )}
          </CardBody>
          <CardFooter display={{ base: "none", lg: "flex" }} justify="flex-end">
            {activeThread ? (
              <HStack spacing={2}>
                <Badge colorScheme={getThreadBadgeColor(activeThread.type)}>
                  {THREAD_CATEGORY_LABEL[activeThread.type]}
                </Badge>
                <Badge colorScheme={activeThread.unreadCount === 0 ? "green" : "red"}>
                  {activeThread.unreadCount === 0 ? "既読" : `未読 ${activeThread.unreadCount}`}
                </Badge>
                <Badge colorScheme="gray" variant="subtle" display="flex" alignItems="center" gap={1}>
                  <FiCheckCircle />
                  {formatDateTime(activeThread.updatedAt)}
                </Badge>
              </HStack>
            ) : null}
          </CardFooter>
        </Card>
      </Grid>

      {/* DM Modal */}
      <Modal isOpen={dmModal.isOpen} onClose={() => { dmModal.onClose(); resetModals(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>応募者にDMを送る</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>案件</FormLabel>
                <Select
                  placeholder="案件を選択"
                  value={dmState.opportunityId}
                  onChange={(event) =>
                    setDmState((prev) => ({ ...prev, opportunityId: event.target.value, applicantId: undefined }))
                  }
                  isDisabled={loadingOpportunities}
                >
                  {opportunities
                    .filter((item) => item.status !== "closed")
                    .map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.title}
                      </option>
                    ))}
                </Select>
              </FormControl>
              <FormControl isDisabled={!selectedOpportunityForDm}>
                <FormLabel>応募者</FormLabel>
                <Select
                  placeholder={selectedOpportunityForDm ? "応募者を選択" : "先に案件を選択してください"}
                  value={dmState.applicantId ?? ""}
                  onChange={(event) =>
                    setDmState((prev) => ({ ...prev, applicantId: event.target.value || undefined }))
                  }
                >
                  {selectedOpportunityForDm?.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>初回メッセージ（任意）</FormLabel>
                <Textarea
                  placeholder="DMと同時に送信するメッセージを入力"
                  value={dmState.messageBody}
                  onChange={(event) =>
                    setDmState((prev) => ({ ...prev, messageBody: event.target.value }))
                  }
                  resize="vertical"
                  minH="120px"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { dmModal.onClose(); resetModals(); }}>
              キャンセル
            </Button>
            <Button colorScheme="teal" onClick={handleCreateDm}>
              DMを開始
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Group Modal */}
      <Modal
        isOpen={groupModal.isOpen}
        onClose={() => {
          groupModal.onClose();
          resetModals();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>グループを作成</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>案件</FormLabel>
                <Select
                  placeholder="案件を選択"
                  value={groupState.opportunityId}
                  onChange={(event) =>
                    setGroupState((prev) => ({
                      ...prev,
                      opportunityId: event.target.value,
                      participantIds: [],
                    }))
                  }
                >
                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>グループ名</FormLabel>
                <Input
                  placeholder="例: 収穫1班の共有トーク"
                  value={groupState.groupName}
                  onChange={(event) =>
                    setGroupState((prev) => ({ ...prev, groupName: event.target.value }))
                  }
                />
              </FormControl>
              <FormControl isDisabled={!selectedOpportunityForGroup}>
                <FormLabel>参加メンバー</FormLabel>
                <CheckboxGroup
                  value={groupState.participantIds}
                  onChange={(value) =>
                    setGroupState((prev) => ({
                      ...prev,
                      participantIds: Array.isArray(value)
                        ? value.map((item) => String(item))
                        : [],
                    }))
                  }
                >
                  <Stack spacing={2}>
                    <Checkbox value={farmerId} isDisabled>
                      {farmerDisplayName}（農家）
                    </Checkbox>
                    {selectedOpportunityForGroup?.participants.map((participant) => (
                      <Checkbox key={participant.id} value={participant.id}>
                        {participant.name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { groupModal.onClose(); resetModals(); }}>
              キャンセル
            </Button>
            <Button colorScheme="purple" onClick={handleCreateGroup}>
              グループを作成
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Broadcast Modal */}
      <Modal
        isOpen={broadcastModal.isOpen}
        onClose={() => {
          broadcastModal.onClose();
          resetModals();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>一斉連絡を送信</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>案件</FormLabel>
                <Select
                  placeholder="案件を選択"
                  value={broadcastState.opportunityId}
                  onChange={(event) =>
                    setBroadcastState((prev) => ({ ...prev, opportunityId: event.target.value }))
                  }
                >
                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {selectedOpportunityForBroadcast ? (
                <Stack spacing={1}>
                  <Text fontSize="sm" fontWeight="semibold">
                    送信対象
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    農家 + {selectedOpportunityForBroadcast.participants.length} 名の参加者
                  </Text>
                </Stack>
              ) : null}
              <FormControl>
                <FormLabel>メッセージ</FormLabel>
                <Textarea
                  placeholder="全員に共有したい連絡事項を記載"
                  value={broadcastState.messageBody}
                  onChange={(event) =>
                    setBroadcastState((prev) => ({ ...prev, messageBody: event.target.value }))
                  }
                  resize="vertical"
                  minH="160px"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { broadcastModal.onClose(); resetModals(); }}>
              キャンセル
            </Button>
            <Button colorScheme="orange" onClick={handleBroadcast}>
              一斉送信
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
};
