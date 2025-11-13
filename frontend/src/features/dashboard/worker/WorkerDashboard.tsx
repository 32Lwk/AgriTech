"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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
  CardFooter,
  CardHeader,
  CloseButton,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
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
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Tag,
  Textarea,
  Text,
  Wrap,
  WrapItem,
  useDisclosure,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import {
  FiClipboard,
  FiCompass,
  FiHome,
  FiMap,
  FiMessageCircle,
  FiSend,
  FiSearch,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import {
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
} from "@chakra-ui/react";
import LeafletMap, { MapMarker } from "@/components/map/LeafletMap";
import StatCard from "@/components/ui/StatCard";
import {
  FARMER_FARM_TYPE_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_FARMING_OPTIONS,
  INTEREST_WORKSTYLE_OPTIONS,
} from "@/constants/profile";
import { OPPORTUNITIES } from "@/mock-data/opportunities";
import { WORKER_STATS } from "@/mock-data/metrics";
import { EXCHANGE_VENUES } from "@/mock-data/exchangeVenues";
import { useAuth } from "@/features/auth/AuthContext";
import type {
  Opportunity,
  OpportunityStatus,
  OpportunityStatusLabel,
} from "@/features/opportunities/types";
import {
  ProfileEditorModal,
  type ProfileEditorValue,
} from "@/features/profile/ProfileEditorModal";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import type { Map as LeafletMapInstance, LatLngBounds } from "leaflet";

type WorkerTab = "home" | "active" | "map" | "chat" | "profile";

const prefectureOptions = [
  { label: "すべて", value: "all" },
  ...Array.from(new Set(OPPORTUNITIES.map((item) => item.location.prefecture))).map(
    (prefecture) => ({
      label: prefecture,
      value: prefecture,
    }),
  ),
];

const onboardingSteps = [
  {
    title: "応募先を探す",
    description: "地域・カテゴリーで絞り込み、気になる募集を保存",
  },
  {
    title: "応募＆チャット",
    description: "応募後はチャットで日程や持ち物を確認",
  },
  {
    title: "現地で参加",
    description: "アプリからチェックインして参加記録を残す",
  },
  {
    title: "振り返り・マイル交換",
    description: "体験レポート投稿とマイル交換で更なる学びへ",
  },
];

const INTEREST_LABEL_MAP = Object.fromEntries(
  INTEREST_FARMING_OPTIONS.map((option) => [option.value, option.label]),
);

const WORKSTYLE_LABEL_MAP = Object.fromEntries(
  INTEREST_WORKSTYLE_OPTIONS.map((option) => [option.value, option.label]),
);

const FARM_TYPE_LABEL_MAP = Object.fromEntries(
  FARMER_FARM_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const MILE_REWARD_OPTIONS = [
  { value: "market_coupon", label: "直売所クーポン（3,000 mile）" },
  { value: "workshop_ticket", label: "食農ワークショップ参加権（5,000 mile）" },
  { value: "specialty_box", label: "豊橋産野菜セット（7,000 mile）" },
];

type StatusFilter = OpportunityStatus | "all" | "applied";

const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, OpportunityStatusLabel> = {
  open: "募集中",
  in_progress: "募集済み",
  closed: "完了済み",
};

const OPPORTUNITY_STATUS_COLOR: Record<OpportunityStatus, string> = {
  open: "blue",
  in_progress: "teal",
  closed: "gray",
};

const CHAT_PREVIEW_BY_STATUS: Record<OpportunityStatus, string> = {
  open: "募集前の質問を受付中です。気になる点をチャットで確認しましょう。",
  in_progress: "参加確定済み。集合時間や作業内容の最終確認を行っています。",
  closed: "参加を終えました。振り返りメモと次回案内を受け取れます。",
};

type ChatThread = {
  id: string;
  title: string;
  status: OpportunityStatus;
  statusLabel: OpportunityStatusLabel;
  preview: string;
  updatedAt: string;
  owner: Opportunity["owner"];
  isApplied: boolean;
};

type ChatMessage = {
  id: string;
  author: string;
  role: "farmer" | "worker";
  text: string;
  timestamp: string;
};

const buildConversation = (thread: ChatThread): ChatMessage[] => {
  const ownerName = thread.owner.name;
  switch (thread.status) {
    case "open":
      return [
        {
          id: `${thread.id}-msg-1`,
          author: thread.owner.name,
          role: "farmer",
          text: "お問い合わせありがとうございます！集合場所や作業内容で気になる点はありますか？",
          timestamp: "11:05",
        },
        {
          id: `${thread.id}-msg-2`,
          author: "あなた（モック）",
          role: "worker",
          text: "持ち物と当日のタイムスケジュールを教えてください。",
          timestamp: "11:08",
        },
        {
          id: `${thread.id}-msg-3`,
          author: ownerName,
          role: "farmer",
          text: "軍手はこちらで用意します。6:20集合、午前は収穫、午後は選別を予定しています。",
          timestamp: "11:12",
        },
      ];
    case "in_progress":
      return [
        {
          id: `${thread.id}-msg-1`,
          author: ownerName,
          role: "farmer",
          text: "明日の天候は晴れ予報です。熱中症対策として水分補給をお願いします！",
          timestamp: "18:30",
        },
        {
          id: `${thread.id}-msg-2`,
          author: "あなた（モック）",
          role: "worker",
          text: "了解しました。15分ほど早めに到着しても問題ありませんか？",
          timestamp: "18:32",
        },
        {
          id: `${thread.id}-msg-3`,
          author: ownerName,
          role: "farmer",
          text: "もちろん大丈夫です。倉庫前でスタッフがご案内しますね。",
          timestamp: "18:36",
        },
      ];
    case "closed":
    default:
      return [
        {
          id: `${thread.id}-msg-1`,
          author: ownerName,
          role: "farmer",
          text: "先日の作業お疲れさまでした。おかげで予定より早く出荷準備が整いました。",
          timestamp: "17:05",
        },
        {
          id: `${thread.id}-msg-2`,
          author: "あなた（モック）",
          role: "worker",
          text: "貴重な経験ありがとうございました！また参加できる日を楽しみにしています。",
          timestamp: "17:11",
        },
        {
          id: `${thread.id}-msg-3`,
          author: ownerName,
          role: "farmer",
          text: "次回募集を公開したらお知らせします。アンケートにもご協力いただけると嬉しいです。",
          timestamp: "17:16",
        },
      ];
  }
};

export default function WorkerDashboard() {
  const toast = useToast();
  const { currentUser, updateProfile } = useAuth();
  const [filterPrefecture, setFilterPrefecture] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedFarmTypes, setSelectedFarmTypes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedWorkstyles, setSelectedWorkstyles] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<WorkerTab>("home");
  const [applied, setApplied] = useState<Record<string, boolean>>({
    "op-001": true,
    "op-024": true,
    "op-033": true,
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [selectedChatThreadId, setSelectedChatThreadId] = useState<string | null>(null);
  const onboarding = useDisclosure({ defaultIsOpen: true });
  const profileModal = useDisclosure();
  const milesModal = useDisclosure();
  const mapDetailModal = useDisclosure();
  const chatDetailModal = useDisclosure();
  const {
    isOpen: isChatDetailOpen,
    onOpen: openChatDetail,
    onClose: closeChatDetail,
  } = chatDetailModal;
  const [mileSelection, setMileSelection] = useState("market_coupon");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedVenueDate, setSelectedVenueDate] = useState("");
  const [selectedVenueSlot, setSelectedVenueSlot] = useState("");
  const isMobile = useBreakpointValue({ base: true, lg: false }) ?? false;
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const mapListRef = useRef<HTMLDivElement | null>(null);
  const [mapListMaxHeightPx, setMapListMaxHeightPx] = useState<number | null>(null);
  const [chatReplies, setChatReplies] = useState<Record<string, ChatMessage[]>>({});
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const messageIdRef = useRef(0);

  const normalizedKeyword = useMemo(
    () => searchKeyword.trim().toLowerCase(),
    [searchKeyword],
  );

  const toggleSelection = useCallback(
    (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
      setter((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value],
      );
    },
    [],
  );

  const toggleFarmType = useCallback(
    (value: string) => toggleSelection(value, setSelectedFarmTypes),
    [toggleSelection],
  );

  const toggleInterest = useCallback(
    (value: string) => toggleSelection(value, setSelectedInterests),
    [toggleSelection],
  );

  const toggleWorkstyle = useCallback(
    (value: string) => toggleSelection(value, setSelectedWorkstyles),
    [toggleSelection],
  );

  const resetFilters = useCallback(() => {
    setFilterPrefecture("all");
    setStatusFilter("all");
    setSelectedFarmTypes([]);
    setSelectedInterests([]);
    setSelectedWorkstyles([]);
    setSearchKeyword("");
  }, []);

  const matchesCommonFilters = useCallback(
    (item: Opportunity) => {
      if (item.status === "closed" && !applied[item.id]) {
        return false;
      }
      if (filterPrefecture !== "all" && item.location.prefecture !== filterPrefecture) {
        return false;
      }
      if (
        selectedFarmTypes.length > 0 &&
        !selectedFarmTypes.some((value) => item.farmTypes.includes(value))
      ) {
        return false;
      }
      if (
        selectedInterests.length > 0 &&
        !selectedInterests.every((value) => item.interestTags.includes(value))
      ) {
        return false;
      }
      if (
        selectedWorkstyles.length > 0 &&
        !selectedWorkstyles.every((value) => item.workstyleTags.includes(value))
      ) {
        return false;
      }
      if (normalizedKeyword) {
        const haystack = [
          item.title,
          item.description,
          item.farmName,
          item.tags.join(" "),
          item.location.city,
          item.location.address,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedKeyword)) {
          return false;
        }
      }
      return true;
    },
    [
      applied,
      filterPrefecture,
      normalizedKeyword,
      selectedFarmTypes,
      selectedInterests,
      selectedWorkstyles,
    ],
  );

  const filteredOpportunities = useMemo(() => {
    return OPPORTUNITIES.filter((item) => {
      if (!matchesCommonFilters(item)) {
        return false;
      }
      if (statusFilter === "open") {
        return item.status === "open";
      }
      if (statusFilter === "in_progress") {
        return item.status === "in_progress";
      }
      if (statusFilter === "applied") {
        return Boolean(applied[item.id]);
      }
      return true;
    });
  }, [applied, matchesCommonFilters, statusFilter]);

  const appliedOpportunities = useMemo(
    () => OPPORTUNITIES.filter((item) => applied[item.id]),
    [applied],
  );

  const recommendedOpportunities = useMemo(
    () => filteredOpportunities.slice(0, 6),
    [filteredOpportunities],
  );

  const mapOpportunities = useMemo(
    () =>
      OPPORTUNITIES.filter(
        (item) =>
          matchesCommonFilters(item) && (item.status === "open" || applied[item.id]),
      ),
    [applied, matchesCommonFilters],
  );

  const mapMarkers = useMemo(
    () =>
      mapOpportunities.map((item) => {
        const farmTypeLabel = item.farmTypes
          .map((value) => FARM_TYPE_LABEL_MAP[value] ?? value)
          .join("・");
        const statusLabel = applied[item.id] ? "（応募済み）" : "（募集中）";
        return {
          id: item.id,
          position: [item.location.lat, item.location.lng] as [number, number],
          title: item.title,
          description: `${item.location.address}${
            farmTypeLabel ? `・${farmTypeLabel}` : ""
          }・${item.rewardMiles} mile ${statusLabel}`,
        };
      }),
    [applied, mapOpportunities],
  );

  const detailMapMarkers = useMemo<MapMarker[]>(
    () =>
      activeOpportunity
        ? [
            {
              id: `${activeOpportunity.id}-detail-marker`,
              position: [
                activeOpportunity.location.lat,
                activeOpportunity.location.lng,
              ],
              title: activeOpportunity.title,
              description: `${activeOpportunity.location.prefecture} ${activeOpportunity.location.city}`,
              variant: "blue",
            },
          ]
        : [],
    [activeOpportunity],
  );

  const [visibleOpportunityIds, setVisibleOpportunityIds] = useState<string[]>(
    () => mapOpportunities.map((item) => item.id),
  );

  const recalcListHeight = useCallback(() => {
    if (typeof window === "undefined") return;
    const listEl = mapListRef.current;
    if (!listEl) return;
    const listRect = listEl.getBoundingClientRect();
    const bottomPadding = 24; // align with container padding/bottom margin
    const available = window.innerHeight - listRect.top - bottomPadding;
    setMapListMaxHeightPx(Math.max(available, 160));
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: LatLngBounds) => {
      setVisibleOpportunityIds((prev) => {
        const ids = mapOpportunities
          .filter((item) =>
            bounds.contains([item.location.lat, item.location.lng]),
          )
          .map((item) => item.id);
        if (
          ids.length === prev.length &&
          ids.every((id, index) => id === prev[index])
        ) {
          return prev;
        }
        return ids;
      });
      recalcListHeight();
    },
    [mapOpportunities, recalcListHeight],
  );

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    if (userLocation) return userLocation;
    if (mapMarkers.length > 0) return mapMarkers[0].position;
    return undefined;
  }, [userLocation, mapMarkers]);

  const handleMapReady = useCallback(
    (map: LeafletMapInstance) => {
      mapInstanceRef.current = map;
      map.whenReady(() => {
        map.invalidateSize();
        handleBoundsChange(map.getBounds());
      });
      setTimeout(() => {
        map.invalidateSize();
        handleBoundsChange(map.getBounds());
      }, 100);
    },
    [handleBoundsChange],
  );

  useEffect(() => {
    if (activeTab === "map") {
      requestAnimationFrame(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        if (mapInstanceRef.current) {
          handleBoundsChange(mapInstanceRef.current.getBounds());
        }
      }, 150);
    }
  }, [activeTab, handleBoundsChange, isMobile, mapMarkers.length, recalcListHeight]);

  useEffect(() => {
    return () => {
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      handleBoundsChange(mapInstanceRef.current.getBounds());
    } else {
      setVisibleOpportunityIds(mapOpportunities.map((item) => item.id));
    }
  }, [handleBoundsChange, mapOpportunities]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    recalcListHeight();
    const handleResize = () => recalcListHeight();
    window.addEventListener("resize", handleResize);

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => recalcListHeight());
      if (mapSectionRef.current) {
        observer.observe(mapSectionRef.current);
      }
      if (mapBoxRef.current) {
        observer.observe(mapBoxRef.current);
      }
      if (mapListRef.current) {
        observer.observe(mapListRef.current);
      }
      observers.push(observer);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [recalcListHeight]);

  useEffect(() => {
    recalcListHeight();
  }, [recalcListHeight, visibleOpportunityIds.length, mapOpportunities.length, activeTab]);

  const unreadNotifications = Math.max(appliedOpportunities.length - 1, 0);
  const unreadMessages = appliedOpportunities.length > 0 ? 2 : 0;

  const handleApplyToggle = useCallback(
    (opportunityId: string) => {
      setApplied((prev) => {
        const next = { ...prev, [opportunityId]: !prev[opportunityId] };
        const isApplied = next[opportunityId];
        toast({
          title: isApplied ? "応募済みに設定しました" : "応募を取り消しました",
          description: isApplied
            ? "運営からの確認を待ちましょう。"
            : "応募の取り消しが完了しました。",
          status: isApplied ? "success" : "info",
        });
        return next;
      });
    },
    [toast],
  );

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "位置情報が取得できません",
        description: "お使いのブラウザが位置情報取得に対応していません。",
        status: "error",
      });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        toast({
          title: "現在地を取得しました",
          description: "マップを現在地に移動しました。",
          status: "success",
        });
        setIsLocating(false);
      },
      () => {
        toast({
          title: "現在地が取得できませんでした",
          description: "位置情報の許可設定をご確認ください。",
          status: "error",
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  }, [toast]);

  const handleOpportunityOpen = useCallback(
    (opportunity: Opportunity) => {
      setSelectedOpportunityId(opportunity.id);
      setActiveOpportunity(opportunity);
      mapDetailModal.onOpen();
    },
    [mapDetailModal],
  );

  const handleMarkerSelect = useCallback(
    (marker: MapMarker) => {
      const opportunity =
        mapOpportunities.find((item) => item.id === marker.id) ?? null;
      if (opportunity) {
        handleOpportunityOpen(opportunity);
      }
    },
    [handleOpportunityOpen, mapOpportunities],
  );

  const openChatThread = useCallback(
    (threadId: string) => {
      setSelectedChatThreadId(threadId);
      setActiveTab("chat");
      if (isMobile) {
        openChatDetail();
      }
    },
    [isMobile, openChatDetail],
  );

  useEffect(() => {
    if (!isMobile && isChatDetailOpen) {
      closeChatDetail();
    }
  }, [closeChatDetail, isChatDetailOpen, isMobile]);

  useEffect(() => {
    if (!mapDetailModal.isOpen) {
      setSelectedOpportunityId(null);
      setActiveOpportunity(null);
    }
  }, [mapDetailModal.isOpen]);

  useEffect(() => {
    if (
      selectedOpportunityId &&
      !mapOpportunities.some((item) => item.id === selectedOpportunityId)
    ) {
      setSelectedOpportunityId(null);
    }
  }, [mapOpportunities, selectedOpportunityId]);

  useEffect(() => {
    if (!milesModal.isOpen) {
      setSelectedVenueId(null);
      setSelectedVenueDate("");
      setSelectedVenueSlot("");
      setMileSelection("market_coupon");
    }
  }, [milesModal.isOpen]);

  const openProfileModal = useCallback(() => {
    profileModal.onOpen();
  }, [profileModal]);

  const profileInitialValue = useMemo<ProfileEditorValue>(
    () => ({
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      password: currentUser?.password ?? "",
      location: currentUser?.location ?? "",
      gender: currentUser?.gender ?? "prefer_not_to_say",
      birthDate: currentUser?.birthDate ?? "",
      occupation: currentUser?.occupation ?? "",
      interests: currentUser?.interests ?? [],
      catchphrase: currentUser?.catchphrase ?? "",
      avatarUrl: currentUser?.avatarUrl ?? "",
    }),
    [currentUser],
  );

  const handleProfileSubmit = useCallback(
    (value: ProfileEditorValue) => {
      if (!currentUser) {
      profileModal.onClose();
        return;
      }
      updateProfile(currentUser.id, {
        name: value.name,
        email: value.email,
        password: value.password,
        location: value.location,
        gender: value.gender,
        birthDate: value.birthDate,
        occupation: value.occupation,
        interests: value.interests,
        catchphrase: value.catchphrase,
        avatarUrl: value.avatarUrl,
      });

      toast({
        title: "プロフィールを更新しました",
        description: "モックとして保存しました。ページを更新しても反映されたままになります。",
        status: "success",
      });
      profileModal.onClose();
    },
    [currentUser, profileModal, toast, updateProfile],
  );

  const venueMarkers = useMemo(
    () =>
      EXCHANGE_VENUES.map((venue) => ({
        id: venue.id,
        position: venue.position,
        title: venue.name,
        description: `${venue.address}・${venue.exchangeMiles.toLocaleString()} mile`,
        variant: venue.type === "live_house" ? ("purple" as const) : ("blue" as const),
      })),
    [],
  );

  const selectedVenue = useMemo(
    () => EXCHANGE_VENUES.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId],
  );

  const handleVenueMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedVenueId(marker.id);
  }, []);

  const handleVenueExchange = useCallback(() => {
    if (!selectedVenueId || !selectedVenueDate || !selectedVenueSlot) {
      toast({
        title: "会場と日時を選択してください",
        description: "マップから会場を選択し、日付と時間帯を指定してください。",
        status: "warning",
      });
      return;
    }
    const venue = EXCHANGE_VENUES.find((entry) => entry.id === selectedVenueId);
    if (!venue) return;
    toast({
      title: "マイル交換を申請しました（モック）",
      description: `${venue.name} を ${selectedVenueDate} ${selectedVenueSlot} で予約リクエストしました。運営チームからの連絡をお待ちください。`,
      status: "success",
    });
      milesModal.onClose();
  }, [selectedVenueDate, selectedVenueId, selectedVenueSlot, milesModal, toast]);

  const handleRewardRequest = useCallback(() => {
      const rewardLabel =
        MILE_REWARD_OPTIONS.find((option) => option.value === mileSelection)?.label ??
        "選択された特典";
      toast({
        title: "マイル交換を申請しました（モック）",
        description: `${rewardLabel} を希望として受け付けました。運営チームからの連絡をお待ちください。`,
        status: "success",
      });
    milesModal.onClose();
  }, [mileSelection, milesModal, toast]);

  const renderOpportunityCard = (item: Opportunity) => {
    const isApplied = applied[item.id] ?? false;
    const capacityRate = Math.round((item.capacity.filled / item.capacity.total) * 100);
    const isAlmostFull = capacityRate >= 80;
    const statusLabel = OPPORTUNITY_STATUS_LABEL[item.status];
    const statusColor = OPPORTUNITY_STATUS_COLOR[item.status];

    return (
      <Card key={item.id} variant="outline" borderRadius="xl" role="article">
        <CardHeader>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Badge colorScheme={statusColor} w="fit-content">
                {statusLabel}
              </Badge>
              <Heading size="sm">{item.title}</Heading>
              <Text color="gray.600" fontSize="sm">
                {item.farmName}・{item.location.prefecture} {item.location.city}
              </Text>
            </Stack>
            <Wrap spacing={2}>
              {item.tags.map((tag) => (
                <WrapItem key={`${item.id}-tag-${tag}`}>
                  <Tag colorScheme="blue" size="sm">
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            <Wrap spacing={2}>
              {item.farmTypes.map((tag) => (
                <WrapItem key={`${item.id}-farm-${tag}`}>
                  <Tag size="sm" colorScheme="agri" variant="outline">
                    {FARM_TYPE_LABEL_MAP[tag] ?? tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            <Wrap spacing={2}>
              {item.interestTags.map((tag) => (
                <WrapItem key={`${item.id}-interest-${tag}`}>
                  <Tag size="sm" colorScheme="teal" variant="subtle">
                    {INTEREST_LABEL_MAP[tag] ?? tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            <Wrap spacing={2}>
              {item.workstyleTags.map((tag) => (
                <WrapItem key={`${item.id}-workstyle-${tag}`}>
                  <Tag size="sm" colorScheme="purple" variant="subtle">
                    {WORKSTYLE_LABEL_MAP[tag] ?? tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Stack>
        </CardHeader>
        <CardBody pt={0}>
          <Stack spacing={3}>
            {item.imageUrls && item.imageUrls.length > 0 && (
              <Box borderRadius="md" overflow="hidden" borderWidth="1px">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {item.imageUrls.slice(0, 4).map((imageUrl, index) => (
                    <Box key={index} position="relative" h="120px" w="100%">
                      <Image
                        src={imageUrl}
                        alt={`${item.title} 画像 ${index + 1}`}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        cursor="pointer"
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`<img src="${imageUrl}" style="max-width:100%; height:auto;" />`);
                          }
                        }}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
                {item.imageUrls.length > 4 && (
                  <Text fontSize="xs" color="gray.500" textAlign="center" p={2}>
                    他 {item.imageUrls.length - 4} 件の画像
                  </Text>
                )}
              </Box>
            )}
            <HStack spacing={3} align="center">
              <Avatar size="sm" name={item.owner.name} src={item.owner.avatarUrl} />
              <Stack spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {item.owner.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {item.owner.tagline}
                </Text>
              </Stack>
            </HStack>
            <Text fontSize="sm" color="gray.700">
              {item.description}
            </Text>
            <Divider />
            <HStack justify="space-between" fontSize="sm" flexWrap="wrap">
              <Text color="gray.600">
                期間: {item.startDate} 〜 {item.endDate}
              </Text>
              <Text fontWeight="bold" color="blue.500">
                {item.rewardMiles} mile
              </Text>
            </HStack>
            <Stack spacing={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  募集状況: {item.capacity.filled}/{item.capacity.total} 名
                </Text>
                {isAlmostFull ? (
                  <Badge colorScheme="red" fontSize="0.7rem">
                    残りわずか
                  </Badge>
                ) : null}
              </HStack>
              <Progress
                value={capacityRate}
                size="sm"
                colorScheme={isAlmostFull ? "red" : "blue"}
                borderRadius="full"
                aria-label={`募集状況 ${capacityRate}%`}
              />
            </Stack>
          </Stack>
        </CardBody>
        <CardFooter>
          <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full">
            <Button
              variant="ghost"
              colorScheme="blue"
              w="full"
              onClick={() => handleOpportunityOpen(item)}
            >
              詳細を見る
            </Button>
            <Button
              variant="outline"
              colorScheme="teal"
              w="full"
              leftIcon={<FiMessageCircle />}
              onClick={() => openChatThread(item.id)}
            >
              チャット
            </Button>
            <Button
              colorScheme={isApplied ? "agri" : "blue"}
              variant={isApplied ? "solid" : "outline"}
              w="full"
              onClick={() => handleApplyToggle(item.id)}
              aria-pressed={isApplied}
            >
              {isApplied ? "応募済み" : "応募する"}
            </Button>
          </Stack>
        </CardFooter>
      </Card>
    );
  };

  const homeContent = (
    <Stack spacing={6}>
      <Stack spacing={2}>
        <Heading size="md">こんにちは、{currentUser?.name ?? "ゲスト"} さん</Heading>
        <Text color="gray.600" fontSize="sm">
          豊橋市の農業案件から、あなたに合う体験を見つけましょう。
        </Text>
      </Stack>

      {onboarding.isOpen ? (
        <Alert
          status="info"
          borderRadius="lg"
          alignItems="flex-start"
          bg="blue.50"
          borderWidth="1px"
        >
          <AlertIcon />
          <Box>
            <AlertTitle>はじめての方へ</AlertTitle>
            <AlertDescription fontSize="sm">
              応募から参加までの流れをSTEPで確認できます。下のボタンからいつでも戻れます。
            </AlertDescription>
            <Stepper size="sm" index={0} mt={4} gap="0">
              {onboardingSteps.map((step) => (
                <Step key={step.title}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepNumber />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box flexShrink={0} textAlign="left">
                    <StepTitle fontSize="sm">{step.title}</StepTitle>
                    <StepDescription fontSize="xs">{step.description}</StepDescription>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </Box>
          <CloseButton
            alignSelf="flex-start"
            onClick={onboarding.onClose}
            aria-label="オンボーディングを閉じる"
          />
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {WORKER_STATS.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            icon={<FiTrendingUp color="#2563eb" />}
          />
        ))}
      </SimpleGrid>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <HStack justify="space-between" align="center" spacing={3}>
            <Heading size="sm">募集を絞り込む</Heading>
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              条件をリセット
            </Button>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Stack spacing={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="キーワードで検索（例: トマト / 収穫 / 技術）"
              />
            </InputGroup>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">都道府県</FormLabel>
                <Select
                  value={filterPrefecture}
                  onChange={(event) => setFilterPrefecture(event.target.value)}
                >
                  {prefectureOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">ステータス</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="all">すべて</option>
                  <option value="open">募集中のみ</option>
          <option value="in_progress">募集済みのみ</option>
                  <option value="applied">応募済みのみ</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <Stack spacing={2}>
              <FormLabel fontSize="sm" color="gray.600">
                農場タイプ
              </FormLabel>
              <Wrap spacing={2}>
                {FARMER_FARM_TYPE_OPTIONS.map((option) => {
                  const isActive = selectedFarmTypes.includes(option.value);
                  return (
                    <WrapItem key={option.value}>
                      <Button
                        size="xs"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme="green"
                        onClick={() => toggleFarmType(option.value)}
                      >
                        {option.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Stack>

            <Stack spacing={2}>
              <FormLabel fontSize="sm" color="gray.600">
                興味タグ
              </FormLabel>
              <Wrap spacing={2}>
                {INTEREST_FARMING_OPTIONS.map((option) => {
                  const isActive = selectedInterests.includes(option.value);
                  return (
                    <WrapItem key={option.value}>
                      <Button
                        size="xs"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme="teal"
                        onClick={() => toggleInterest(option.value)}
                      >
                        {option.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Stack>

            <Stack spacing={2}>
              <FormLabel fontSize="sm" color="gray.600">
                働き方タグ
              </FormLabel>
              <Wrap spacing={2}>
                {INTEREST_WORKSTYLE_OPTIONS.map((option) => {
                  const isActive = selectedWorkstyles.includes(option.value);
                  return (
                    <WrapItem key={option.value}>
                      <Button
                        size="xs"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme="purple"
                        onClick={() => toggleWorkstyle(option.value)}
                      >
                        {option.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      <Stack spacing={4}>
        <HStack justify="space-between">
          <Heading size="sm">おすすめ募集</Heading>
          <Text fontSize="xs" color="gray.500">
            表示件数: {recommendedOpportunities.length}件
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {recommendedOpportunities.map((item) => renderOpportunityCard(item))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );

  const activeContent = (
    <Stack spacing={6}>
      <Heading size="md">応募・ウォッチ中の募集</Heading>
      {appliedOpportunities.length === 0 ? (
        <Card borderRadius="xl" variant="outline">
          <CardBody>
            <Stack spacing={3} textAlign="center">
              <Text fontWeight="semibold">まだ応募済みの募集はありません</Text>
              <Text fontSize="sm" color="gray.600">
                ホームから気になる募集を見つけて、応募またはウォッチリストに追加しましょう。
              </Text>
              <Button colorScheme="blue" onClick={() => setActiveTab("home")}>
                募集を探す
              </Button>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {appliedOpportunities.map((item) => renderOpportunityCard(item))}
        </SimpleGrid>
      )}
    </Stack>
  );

  const mapPanelHeight = useBreakpointValue({
    base: "55vh",
    md: "calc(100vh - 280px)",
  });

  const mapPanelSize = useMemo(() => {
    if (mapPanelHeight == null) return "320px";
    return typeof mapPanelHeight === "number"
      ? `${mapPanelHeight}px`
      : mapPanelHeight;
  }, [mapPanelHeight]);

  const mapListMaxHeight = useMemo(
    () => `calc(100vh - 160px - (${mapPanelSize}))`,
    [mapPanelSize],
  );

  const mapContent = (
    <Flex
      ref={mapSectionRef}
      direction="column"
      gap={2}
      flex="1"
      minH={0}
    >
      <HStack justify="space-between" align="center">
        <Heading size="md">マップで確認</Heading>
        <HStack spacing={2}>
          <IconButton
            aria-label="現在地を取得"
            icon={<FiCompass />}
            onClick={handleRequestLocation}
            isLoading={isLocating}
            variant="ghost"
          />
        </HStack>
      </HStack>
      <Text fontSize="sm" color="gray.600">
        応募済みと募集中の案件のみを表示します。ピンをタップすると詳細がモーダルで開きます。
      </Text>
      <Box
        ref={mapBoxRef}
        flexShrink={0}
        w="100%"
        maxH={mapPanelSize}
        aspectRatio={1}
        borderRadius="xl"
        overflow="hidden"
        borderWidth="1px"
      >
        <LeafletMap
          markers={mapMarkers}
          height="100%"
          zoom={12}
          center={mapCenter}
          onMarkerClick={handleMarkerSelect}
          selectedMarkerId={selectedOpportunityId}
          showPopups={false}
          onMapReady={handleMapReady}
          invalidateSizeKey={`${activeTab}-${mapMarkers.length}`}
          onBoundsChange={handleBoundsChange}
        />
      </Box>
      <Stack
        ref={mapListRef}
        spacing={3}
        flex="1"
        minH={0}
        maxH={
          mapListMaxHeightPx != null
            ? `${mapListMaxHeightPx}px`
            : mapListMaxHeight
        }
        overflowY="auto"
        pr={1}
      >
        <Heading size="sm">マップ表示中の募集</Heading>
        {mapOpportunities.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            条件に一致する募集が見つかりませんでした。
          </Text>
        ) : (
          (() => {
            const visibleOpportunities =
              visibleOpportunityIds.length === 0
                ? mapOpportunities
                : mapOpportunities.filter((item) =>
                    visibleOpportunityIds.includes(item.id),
                  );
            if (visibleOpportunities.length === 0) {
              return (
                <Text fontSize="sm" color="gray.500">
                  現在のマップ範囲に表示中の募集はありません。
                </Text>
              );
            }
            return visibleOpportunities.map((item) => (
              <Button
                key={item.id}
                variant={selectedOpportunityId === item.id ? "solid" : "outline"}
                colorScheme={applied[item.id] ? "agri" : "blue"}
                justifyContent="space-between"
                alignItems="flex-start"
                h="auto"
                py={3}
                px={4}
                onClick={() => handleOpportunityOpen(item)}
              >
                <Box textAlign="left">
                  <Text fontWeight="semibold">{item.title}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {item.location.address}
                  </Text>
                </Box>
                <HStack spacing={2}>
                  <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[item.status]}>
                    {OPPORTUNITY_STATUS_LABEL[item.status]}
                  </Badge>
                  {applied[item.id] ? (
                    <Badge colorScheme="agri" variant="subtle">
                      応募済み
                    </Badge>
                  ) : null}
                </HStack>
              </Button>
            ));
          })()
        )}
      </Stack>
    </Flex>
  );

  const buildTimestamp = () => {
    const timestamp = new Date();
    return `${timestamp.getHours().toString().padStart(2, "0")}:${timestamp
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = useCallback(
    (threadId: string) => {
      const draft = (chatDrafts[threadId] ?? "").trim();
      if (!draft) return;
      setChatReplies((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] ?? []),
          {
            id: `custom-${threadId}-${messageIdRef.current++}`,
            author: "あなた（モック）",
            role: "worker",
            text: draft,
            timestamp: buildTimestamp(),
          },
        ],
      }));
      setChatDrafts((prev) => ({ ...prev, [threadId]: "" }));
      toast({
        title: "メッセージを送信しました（モック）",
        status: "success",
        duration: 2000,
      });
    },
    [chatDrafts, toast],
  );
  const chatThreads = useMemo<ChatThread[]>(() => {
    return OPPORTUNITIES.map((item, index) => {
      const statusLabel = OPPORTUNITY_STATUS_LABEL[item.status];
      const preview = CHAT_PREVIEW_BY_STATUS[item.status];
      const updatedAt = `2025-05-${(index + 12).toString().padStart(2, "0")} ${
        index % 2 === 0 ? "10:20" : "16:45"
      }`;

      return {
        id: item.id,
        title: item.title,
        status: item.status,
        statusLabel,
        preview,
        updatedAt,
        owner: item.owner,
        isApplied: Boolean(applied[item.id]),
      };
    });
  }, [applied]);

  const appliedChatThreads = useMemo(
    () => chatThreads.filter((thread) => thread.isApplied),
    [chatThreads],
  );

  useEffect(() => {
    if (appliedChatThreads.length === 0) {
      setSelectedChatThreadId(null);
      return;
    }

    if (
      !selectedChatThreadId ||
      !appliedChatThreads.some((thread) => thread.id === selectedChatThreadId)
    ) {
      setSelectedChatThreadId(appliedChatThreads[0].id);
    }
  }, [appliedChatThreads, selectedChatThreadId]);

  const activeChatThread = useMemo(() => {
    if (appliedChatThreads.length === 0) return null;
    return appliedChatThreads.find((thread) => thread.id === selectedChatThreadId) ?? null;
  }, [appliedChatThreads, selectedChatThreadId]);

  const conversationView = activeChatThread ? (
    <Stack spacing={3}>
      {[...buildConversation(activeChatThread), ...(chatReplies[activeChatThread.id] ?? [])].map(
        (message) => (
        <Box
          key={message.id}
          borderRadius="lg"
          p={3}
          bg={message.role === "farmer" ? "blue.50" : "teal.50"}
          alignSelf={message.role === "farmer" ? "flex-start" : "flex-end"}
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
        ),
      )}
    </Stack>
  ) : (
    <Text fontSize="sm" color="gray.600">
      チャットを選択すると会話履歴が表示されます。
    </Text>
  );

  const chatContent = (
    <Stack spacing={4}>
      <Heading size="md">チャット</Heading>
      <Text fontSize="sm" color="gray.600">
        応募済みの募集に関するチャットを表示しています。農家との連絡はここから行いましょう。
      </Text>
      {appliedChatThreads.length === 0 ? (
        <Card borderRadius="xl" variant="outline">
          <CardBody>
            <Stack spacing={3} textAlign="center">
              <Text fontWeight="semibold">チャットはまだありません</Text>
              <Text fontSize="sm" color="gray.600">
                応募が完了した募集のチャットがこちらに表示されます。
              </Text>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <Stack spacing={4}>
          <Stack spacing={2}>
            <Text fontSize="sm" fontWeight="semibold">
              チャット一覧
            </Text>
            <Box
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              bg="white"
              px={3}
              py={2}
            >
              <Box overflowX="auto" pb={1}>
                <HStack spacing={3} minW="max-content" align="stretch">
                  {appliedChatThreads.map((thread) => {
                    const isActive = activeChatThread?.id === thread.id;
                    return (
                      <Box
                        key={thread.id}
                        as="button"
                        type="button"
                        onClick={() => openChatThread(thread.id)}
                        px={4}
                        py={3}
                        minW={{ base: "200px", md: "240px" }}
                        maxW={{ base: "80vw", md: "260px" }}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={isActive ? "teal.400" : "gray.200"}
                        bg={isActive ? "teal.50" : "white"}
                        boxShadow={isActive ? "md" : "sm"}
                        textAlign="left"
                        transition="all 0.2s"
                        _hover={{ borderColor: "teal.400" }}
                      >
                        <Stack spacing={1}>
                          <HStack justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                              {thread.title}
                            </Text>
                            <Badge
                              colorScheme={OPPORTUNITY_STATUS_COLOR[thread.status]}
                              whiteSpace="nowrap"
                            >
                              {thread.statusLabel}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            更新: {thread.updatedAt}
                          </Text>
                          <Text fontSize="xs" color="gray.600" noOfLines={2}>
                            {thread.preview}
                          </Text>
                        </Stack>
                      </Box>
                    );
                  })}
                </HStack>
              </Box>
            </Box>
          </Stack>
          <Card variant="outline" borderRadius="xl">
            <CardHeader>
              <Stack spacing={3}>
                <Stack spacing={2}>
                  <Heading size="sm">
                    {activeChatThread
                      ? `${activeChatThread.title}（${activeChatThread.statusLabel}）`
                      : "チャット詳細"}
                  </Heading>
                  {activeChatThread ? (
                    <Stack spacing={1}>
                      <HStack spacing={3} align="center">
                        <Avatar
                          size="sm"
                          name={activeChatThread.owner.name}
                          src={activeChatThread.owner.avatarUrl}
                        />
                        <Stack spacing={0}>
                          <Text fontSize="sm">{activeChatThread.owner.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {activeChatThread.owner.tagline}
                          </Text>
                        </Stack>
                      </HStack>
                      <HStack spacing={2}>
                        <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[activeChatThread.status]}>
                          {activeChatThread.statusLabel}
                        </Badge>
                        <Badge colorScheme="green" variant="subtle">
                          応募済み
                        </Badge>
                      </HStack>
                    </Stack>
                  ) : null}
                </Stack>
                {activeChatThread ? (
                  <Stack
                    spacing={1}
                    borderWidth="1px"
                    borderColor="gray.100"
                    borderRadius="lg"
                    p={3}
                    bg="gray.50"
                  >
                    <Text fontSize="sm" fontWeight="semibold">
                      直近の募集情報
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {activeChatThread.preview}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      更新日時: {activeChatThread.updatedAt}
                    </Text>
                  </Stack>
                ) : null}
              </Stack>
            </CardHeader>
            <CardBody>
              <Flex direction="column" gap={4} minH={{ base: "60vh", md: "70vh" }}>
                <Box flex="1" overflowY="auto" pr={1}>
                  {conversationView}
                </Box>
                {activeChatThread ? (
                  <Stack spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold">
                      メッセージを送信
                    </Text>
                    <Textarea
                      value={chatDrafts[activeChatThread.id] ?? ""}
                      onChange={(event) =>
                        setChatDrafts((prev) => ({
                          ...prev,
                          [activeChatThread.id]: event.target.value,
                        }))
                      }
                      placeholder="メッセージを入力してください"
                      resize="vertical"
                      minH="100px"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && event.altKey) {
                          event.preventDefault();
                          handleSendMessage(activeChatThread.id);
                        }
                      }}
                    />
                    <HStack justify="flex-end">
                      <Button
                        size="sm"
                        colorScheme="teal"
                        rightIcon={<FiSend />}
                        isDisabled={
                          !activeChatThread ||
                          !(chatDrafts[activeChatThread.id]?.trim().length ?? 0)
                        }
                        onClick={() => handleSendMessage(activeChatThread.id)}
                      >
                        送信
                      </Button>
                    </HStack>
                  </Stack>
                ) : null}
              </Flex>
            </CardBody>
          </Card>
        </Stack>
      )}
    </Stack>
  );

  const profileSummary = useMemo(
    () => ({
      name: profileInitialValue.name,
      email: profileInitialValue.email,
      location: profileInitialValue.location,
      gender: profileInitialValue.gender,
      birthDate: profileInitialValue.birthDate,
      occupation: profileInitialValue.occupation,
      catchphrase: profileInitialValue.catchphrase,
      avatarUrl: profileInitialValue.avatarUrl,
      interests: currentUser?.interests ?? [],
    }),
    [currentUser, profileInitialValue],
  );

  const completedOpportunities = useMemo(
    () => OPPORTUNITIES.filter((item) => item.status === "closed"),
    [],
  );

  const completedOpportunityMarkers = useMemo(
    () =>
      completedOpportunities.map((item) => ({
        id: item.id,
        position: [item.location.lat, item.location.lng] as [number, number],
        title: item.title,
        description: `${item.location.prefecture} ${item.location.city}・${item.rewardMiles} mile`,
        variant: "orange" as const,
      })),
    [completedOpportunities],
  );

  const profileContent = (
    <Stack spacing={4}>
      <Heading size="md">プロフィール</Heading>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={4}>
            <HStack align="flex-start" spacing={4}>
              <Avatar size="xl" name={profileSummary.name} src={profileSummary.avatarUrl || undefined} />
              <Stack spacing={1}>
                <Text fontWeight="semibold" fontSize="lg">
                  {profileSummary.name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {profileSummary.email}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {profileSummary.location || "拠点未設定"}
                </Text>
                {profileSummary.catchphrase ? (
                  <Box bg="blue.50" borderRadius="lg" p={3} mt={2}>
                    <Text fontSize="xs" color="blue.700">
                      {profileSummary.catchphrase}
                    </Text>
                  </Box>
                ) : null}
              </Stack>
            </HStack>
            <Button variant="solid" colorScheme="blue" alignSelf="flex-start" onClick={openProfileModal}>
              プロフィールを編集
            </Button>
          </Stack>
        </CardBody>
      </Card>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <Text fontWeight="semibold">基本情報</Text>
            <Text fontSize="sm">
              性別: {GENDER_OPTIONS.find((option) => option.value === profileSummary.gender)?.label ?? "未設定"}
            </Text>
            <Text fontSize="sm">
              生年月日: {profileSummary.birthDate || "未設定"}
            </Text>
            <Text fontSize="sm">職業: {profileSummary.occupation || "未設定"}</Text>
            <Stack spacing={1}>
              <Text fontSize="sm">興味・タグ</Text>
              {profileSummary.interests.length === 0 ? (
                <Text fontSize="xs" color="gray.500">
                  まだタグが設定されていません。
                </Text>
              ) : (
              <Wrap spacing={2}>
                  {profileSummary.interests.map((tag) => (
                  <WrapItem key={tag}>
                    <Tag size="sm" colorScheme="blue" variant="subtle">
                      {INTEREST_LABEL_MAP[tag] ?? WORKSTYLE_LABEL_MAP[tag] ?? tag}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
              )}
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <Text fontWeight="semibold">プロフィールの最適化</Text>
            <Text fontSize="sm" color="gray.600">
              自己紹介や希望条件を記入するとマッチング精度が向上します。
            </Text>
            <Button variant="ghost" colorScheme="blue" onClick={openProfileModal}>
              タグと希望条件を編集
            </Button>
          </Stack>
        </CardBody>
      </Card>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <Text fontWeight="semibold">完了済み案件マップ（モック）</Text>
            {completedOpportunities.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                完了済みの案件はまだありません。
            </Text>
            ) : (
              <Stack spacing={3}>
                <LeafletMap
                  markers={completedOpportunityMarkers}
                  zoom={11}
                  height={260}
                  showPopups
                />
                <Stack spacing={2}>
                  {completedOpportunities.map((item) => (
                    <HStack key={item.id} justify="space-between" align="center">
                      <Text fontSize="sm">{item.title}</Text>
                      <Badge colorScheme="orange">完了</Badge>
                    </HStack>
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );

  const contentByTab: Record<WorkerTab, JSX.Element> = {
    home: homeContent,
    active: activeContent,
    map: mapContent,
    chat: chatContent,
    profile: profileContent,
  };

  const bottomNavigationItems = useMemo(
    () => [
      { key: "home", label: "ホーム", icon: <FiHome /> },
      {
        key: "active",
        label: "応募済み",
        icon: <FiClipboard />,
        badgeCount: unreadNotifications > 0 ? unreadNotifications : undefined,
      },
      { key: "map", label: "マップ", icon: <FiMap /> },
      {
        key: "chat",
        label: "チャット",
        icon: <FiMessageCircle />,
        badgeCount: unreadMessages > 0 ? unreadMessages : undefined,
      },
      { key: "profile", label: "プロフィール", icon: <FiUser /> },
    ],
    [unreadMessages, unreadNotifications],
  );

  return (
    <Flex direction="column" minH="100vh" pb={28} gap={4}>
      <Box flex="1" px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 6, md: 10 }}>
        {contentByTab[activeTab]}
      </Box>
      <BottomNavigation
        items={bottomNavigationItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as WorkerTab)}
      />
      <Modal isOpen={mapDetailModal.isOpen} onClose={mapDetailModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{activeOpportunity?.title ?? "募集詳細"}</ModalHeader>
          <ModalCloseButton />
          {activeOpportunity ? (
            <ModalBody>
              <Stack spacing={3}>
                <HStack spacing={3}>
                  <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[activeOpportunity.status]}>
                    {OPPORTUNITY_STATUS_LABEL[activeOpportunity.status]}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {activeOpportunity.farmName}
                  </Text>
                </HStack>
                {activeOpportunity.imageUrls && activeOpportunity.imageUrls.length > 0 && (
                  <Box borderRadius="md" overflow="hidden" borderWidth="1px">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      {activeOpportunity.imageUrls.map((imageUrl, index) => (
                        <Box key={index} position="relative" h="150px" w="100%">
                          <Image
                            src={imageUrl}
                            alt={`${activeOpportunity.title} 画像 ${index + 1}`}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            cursor="pointer"
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`<img src="${imageUrl}" style="max-width:100%; height:auto;" />`);
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
                <Text fontSize="sm" color="gray.700">
                  {activeOpportunity.description}
                </Text>
                {activeOpportunity.memo && (
                  <Box bg="gray.50" borderRadius="md" p={3}>
                    <Text fontSize="xs" color="gray.600" fontWeight="semibold" mb={1}>
                      メモ
                    </Text>
                    <Text fontSize="sm" color="gray.700">
                      {activeOpportunity.memo}
                    </Text>
                  </Box>
                )}
                <Stack spacing={1} fontSize="sm" color="gray.600">
                  <Text>
                    期間: {activeOpportunity.startDate} 〜 {activeOpportunity.endDate}
                  </Text>
                  <Text>場所: {activeOpportunity.location.address}</Text>
                  <Text>報酬: {activeOpportunity.rewardMiles} mile</Text>
                  <Text>
                    募集状況: {activeOpportunity.capacity.filled}/
                    {activeOpportunity.capacity.total} 名
                  </Text>
                </Stack>
                <Stack spacing={2}>
                  <Wrap spacing={2}>
                    {activeOpportunity.farmTypes.map((tag) => (
                      <WrapItem key={`${activeOpportunity.id}-modal-farm-${tag}`}>
                        <Tag size="sm" colorScheme="green" variant="outline">
                          {FARM_TYPE_LABEL_MAP[tag] ?? tag}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Wrap spacing={2}>
                    {activeOpportunity.interestTags.map((tag) => (
                      <WrapItem key={`${activeOpportunity.id}-modal-interest-${tag}`}>
                        <Tag size="sm" colorScheme="teal" variant="subtle">
                          {INTEREST_LABEL_MAP[tag] ?? tag}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Wrap spacing={2}>
                    {activeOpportunity.workstyleTags.map((tag) => (
                      <WrapItem key={`${activeOpportunity.id}-modal-workstyle-${tag}`}>
                        <Tag size="sm" colorScheme="purple" variant="subtle">
                          {WORKSTYLE_LABEL_MAP[tag] ?? tag}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Stack>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                    農地の場所
                  </Text>
                  <LeafletMap
                    markers={detailMapMarkers}
                    center={
                      detailMapMarkers[0]?.position as [number, number] | undefined
                    }
                    zoom={13}
                    height={260}
                    showPopups
                  />
                </Box>
              </Stack>
            </ModalBody>
          ) : (
            <ModalBody>
              <Text fontSize="sm" color="gray.600">
                募集情報の取得に失敗しました。
              </Text>
            </ModalBody>
          )}
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={mapDetailModal.onClose}>
              閉じる
            </Button>
            {activeOpportunity ? (
              <Button
                colorScheme={applied[activeOpportunity.id] ? "green" : "blue"}
                variant={applied[activeOpportunity.id] ? "solid" : "outline"}
                onClick={() => handleApplyToggle(activeOpportunity.id)}
              >
                {applied[activeOpportunity.id] ? "応募済み" : "応募する"}
              </Button>
            ) : null}
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isMobile && isChatDetailOpen} onClose={closeChatDetail} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {activeChatThread ? `${activeChatThread.title} のチャット` : "チャット"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activeChatThread ? (
              <Stack spacing={4}>
                <Stack spacing={1}>
                  <HStack spacing={3} align="center">
                    <Avatar
                      size="sm"
                      name={activeChatThread.owner.name}
                      src={activeChatThread.owner.avatarUrl}
                    />
                    <Stack spacing={0}>
                      <Text fontSize="sm">{activeChatThread.owner.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {activeChatThread.owner.tagline}
                      </Text>
                    </Stack>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[activeChatThread.status]}>
                      {activeChatThread.statusLabel}
                    </Badge>
                    {activeChatThread.isApplied ? (
                      <Badge colorScheme="green" variant="subtle">
                        応募済み
                      </Badge>
                    ) : null}
                  </HStack>
                </Stack>
                {conversationView}
              </Stack>
            ) : (
              conversationView
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      <ProfileEditorModal
        isOpen={profileModal.isOpen}
        onClose={profileModal.onClose}
        onSubmit={handleProfileSubmit}
        initialValue={profileInitialValue}
        role="worker"
      />
      <Modal isOpen={milesModal.isOpen} onClose={milesModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>マイル交換</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            <Stack spacing={6}>
              <Stack spacing={3}>
                <Text fontSize="sm" color="gray.600">
                  ライブハウス・音楽スタジオをマイルで予約（モック）
                </Text>
                <Wrap spacing={3}>
                  <Tag colorScheme="purple">ライブハウス</Tag>
                  <Tag colorScheme="blue">音楽スタジオ</Tag>
                </Wrap>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <LeafletMap
                    markers={venueMarkers}
                    center={[34.7415, 137.3924]}
                    zoom={12}
                    height={320}
                    onMarkerClick={handleVenueMarkerClick}
                    selectedMarkerId={selectedVenueId}
                    showPopups={false}
                  />
                  <Stack spacing={3}>
                    {selectedVenue ? (
                      <Stack spacing={2}>
                        <Text fontWeight="semibold">{selectedVenue.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {selectedVenue.address}
                        </Text>
                        <Wrap spacing={2}>
                          {selectedVenue.tags.map((tag) => (
                            <Tag
                              key={`${selectedVenue.id}-tag-${tag}`}
                              size="sm"
                              colorScheme={
                                selectedVenue.type === "live_house" ? "purple" : "blue"
                              }
                              variant="subtle"
                            >
                              {tag}
                            </Tag>
                          ))}
                        </Wrap>
                        <Text fontSize="sm" color="gray.700">
                          必要マイル: {selectedVenue.exchangeMiles.toLocaleString()} mile
                        </Text>
                      </Stack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        マップから利用したい会場を選択してください。
                      </Text>
                    )}
                    <FormControl isDisabled={!selectedVenue}>
                      <FormLabel>利用日</FormLabel>
                  <Input
                        type="date"
                        value={selectedVenueDate}
                        onChange={(event) => setSelectedVenueDate(event.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                    <FormControl isDisabled={!selectedVenue}>
                      <FormLabel>時間帯</FormLabel>
                      <Select
                        placeholder="時間帯を選択"
                        value={selectedVenueSlot}
                        onChange={(event) => setSelectedVenueSlot(event.target.value)}
                      >
                        {selectedVenue?.timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </Select>
                </FormControl>
                    <Button
                      colorScheme="blue"
                      isDisabled={!selectedVenue}
                      onClick={handleVenueExchange}
                    >
                      この会場を予約する（モック）
              </Button>
                  </Stack>
                </SimpleGrid>
              </Stack>

              <Divider />

              <Stack spacing={3}>
                <Text fontSize="sm" color="gray.600">
                  その他の特典（モック）
                </Text>
                <HStack spacing={3} align="flex-end" flexWrap="wrap">
                  <FormControl maxW={{ base: "full", md: "280px" }}>
                  <FormLabel>交換したい特典</FormLabel>
                  <Select
                    value={mileSelection}
                    onChange={(event) => setMileSelection(event.target.value)}
                  >
                    {MILE_REWARD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                  <Button colorScheme="blue" onClick={handleRewardRequest}>
                交換を申請
              </Button>
                </HStack>
              </Stack>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

