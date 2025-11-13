"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  CloseButton,
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
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Wrap,
  WrapItem,
  useDisclosure,
  useBreakpointValue,
  useToast,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
} from "@chakra-ui/react";
import {
  FiClipboard,
  FiFilter,
  FiHome,
  FiMap,
  FiMessageCircle,
  FiPlusCircle,
  FiSearch,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import LeafletMap, { MapMarker } from "@/components/map/LeafletMap";
import StatCard from "@/components/ui/StatCard";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { useAuth } from "@/features/auth/AuthContext";
import {
  ProfileEditorModal,
  type ProfileEditorValue,
} from "@/features/profile/ProfileEditorModal";
import {
  FARMER_FARM_TYPE_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_FARMING_OPTIONS,
  INTEREST_WORKSTYLE_OPTIONS,
} from "@/constants/profile";
import { APPLICANTS, OPPORTUNITIES } from "@/mock-data/opportunities";
import type {
  ApplicantStatus,
  Opportunity,
  OpportunityStatus,
  OpportunityStatusLabel,
} from "@/features/opportunities/types";
import { FarmerChatCenter } from "./components/FarmerChatCenter";
import { mileApi, type MileBalance, type MileTransaction } from "./api/miles";
import { FarmlandManager } from "./components/FarmlandManager";
import { farmlandsApi, type Farmland } from "./api/farmlands";

type FarmerTab = "home" | "active" | "map" | "chat" | "profile";

const STATUS_BADGE: Record<ApplicantStatus, { label: string; color: string }> = {
  pending: { label: "審査中", color: "yellow" },
  approved: { label: "承認済み", color: "green" },
  rejected: { label: "却下", color: "red" },
};

const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, OpportunityStatusLabel> = {
  open: "募集中",
  in_progress: "募集済み",
  closed: "完了済み",
};

const OPPORTUNITY_STATUS_COLOR: Record<OpportunityStatus, string> = {
  open: "green",
  in_progress: "yellow",
  closed: "gray",
};

type OpportunityStatusFilter = OpportunityStatus | "all";

const INTEREST_LABEL_MAP = Object.fromEntries(
  INTEREST_FARMING_OPTIONS.map((option) => [option.value, option.label]),
);

const WORKSTYLE_LABEL_MAP = Object.fromEntries(
  INTEREST_WORKSTYLE_OPTIONS.map((option) => [option.value, option.label]),
);

const FARM_TYPE_LABEL_MAP = Object.fromEntries(
  FARMER_FARM_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const FARMER_MILE_OPTIONS = [
  { value: "equipment", label: "農機レンタルチケット（5,000 mile）" },
  { value: "training", label: "スタッフ研修参加サポート（8,000 mile）" },
  { value: "promotion", label: "募集告知の広告強化（10,000 mile）" },
];

const FARMER_ONBOARDING_STEPS = [
  {
    title: "募集テンプレ作成",
    description: "昨シーズンの条件を引き継ぎ、ドラフトで下書き保存",
  },
  {
    title: "応募者コミュニケーション",
    description: "チャットと自動リマインドで連絡を一本化",
  },
  {
    title: "マイル連動と振り返り",
    description: "参加実績と評価を記録し、マイル交換に反映",
  },
];

export default function FarmerDashboard() {
  const toast = useToast();
  const { currentUser, updateProfile } = useAuth();
  const createModal = useDisclosure();
  const mapDetailModal = useDisclosure();
  const profileModal = useDisclosure();
  const milesModal = useDisclosure();
  const farmlandModal = useDisclosure();
  const onboardingGuide = useDisclosure({ defaultIsOpen: true });
  const editModal = useDisclosure();
  const [activeTab, setActiveTab] = useState<FarmerTab>("home");
  const [applicantStatuses, setApplicantStatuses] = useState<Record<string, string>>(
    () =>
      APPLICANTS.reduce(
        (acc, applicant) => ({ ...acc, [applicant.id]: applicant.status }),
        {},
      ),
  );
  const [applicantFilter, setApplicantFilter] = useState<string | "all">("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [opportunityStatusFilter, setOpportunityStatusFilter] =
    useState<OpportunityStatusFilter>("all");
  const [selectedOpportunityFarmTypes, setSelectedOpportunityFarmTypes] = useState<string[]>([]);
  const [selectedOpportunityInterests, setSelectedOpportunityInterests] = useState<string[]>([]);
  const [selectedOpportunityWorkstyles, setSelectedOpportunityWorkstyles] = useState<string[]>([]);
  const [searchOpportunityKeyword, setSearchOpportunityKeyword] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityOverrides, setOpportunityOverrides] = useState<
    Record<
      string,
      Pick<Opportunity, "title" | "description" | "startDate" | "endDate" | "rewardMiles">
    >
  >({});
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    rewardMiles: "",
  });
  const [chatFocusSignal, setChatFocusSignal] = useState<{ id: string; nonce: number } | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [mileBalance, setMileBalance] = useState<MileBalance | null>(null);
  const [loadingMileBalance, setLoadingMileBalance] = useState(false);
  const [farmlands, setFarmlands] = useState<Farmland[]>([]);
  const [selectedFarmlandId, setSelectedFarmlandId] = useState<string>("");

  const profileInitialValue = useMemo<ProfileEditorValue>(
    () => ({
      name: currentUser?.name ?? "豊橋モデル農園（モック）",
      email: currentUser?.email ?? "farmer@example.com",
      password: currentUser?.password ?? "password123",
      location: currentUser?.location ?? "愛知県 豊橋市",
      gender: currentUser?.gender ?? "prefer_not_to_say",
      birthDate: currentUser?.birthDate ?? "",
      occupation: currentUser?.occupation ?? "農家",
      interests: currentUser?.interests ?? [],
      catchphrase: currentUser?.catchphrase ?? "",
      avatarUrl: currentUser?.avatarUrl ?? "",
    }),
    [currentUser],
  );

  const normalizedOpportunityKeyword = useMemo(
    () => searchOpportunityKeyword.trim().toLowerCase(),
    [searchOpportunityKeyword],
  );

  const toggleSelection = useCallback(
    (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
      setter((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
    },
    [],
  );

  const toggleOpportunityFarmType = useCallback(
    (value: string) => toggleSelection(value, setSelectedOpportunityFarmTypes),
    [toggleSelection],
  );

  const toggleOpportunityInterest = useCallback(
    (value: string) => toggleSelection(value, setSelectedOpportunityInterests),
    [toggleSelection],
  );

  const toggleOpportunityWorkstyle = useCallback(
    (value: string) => toggleSelection(value, setSelectedOpportunityWorkstyles),
    [toggleSelection],
  );

  const resetOpportunityFilters = useCallback(() => {
    setOpportunityStatusFilter("all");
    setSelectedOpportunityFarmTypes([]);
    setSelectedOpportunityInterests([]);
    setSelectedOpportunityWorkstyles([]);
    setSearchOpportunityKeyword("");
  }, []);

  const matchesOpportunityFilters = useCallback(
    (item: Opportunity) => {
      if (
        selectedOpportunityFarmTypes.length > 0 &&
        !selectedOpportunityFarmTypes.some((value) => item.farmTypes.includes(value))
      ) {
        return false;
      }
      if (
        selectedOpportunityInterests.length > 0 &&
        !selectedOpportunityInterests.every((value) => item.interestTags.includes(value))
      ) {
        return false;
      }
      if (
        selectedOpportunityWorkstyles.length > 0 &&
        !selectedOpportunityWorkstyles.every((value) => item.workstyleTags.includes(value))
      ) {
        return false;
      }
      if (normalizedOpportunityKeyword) {
        const haystack = [
          item.title,
          item.description,
          item.farmName,
          item.location.city,
          item.location.address,
          item.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedOpportunityKeyword)) {
          return false;
        }
      }
      return true;
    },
    [
      normalizedOpportunityKeyword,
      selectedOpportunityFarmTypes,
      selectedOpportunityInterests,
      selectedOpportunityWorkstyles,
    ],
  );

  const ownedOpportunitySource = useMemo(() => {
    if (!currentUser) return OPPORTUNITIES;
    return OPPORTUNITIES.filter(
      (item) =>
        item.owner.id === currentUser.id ||
        item.managingFarmers.some((manager) => manager.id === currentUser.id),
    );
  }, [currentUser]);

  const ownedOpportunities = useMemo(() => {
    return ownedOpportunitySource.map((item) => {
      const override = opportunityOverrides[item.id];
      if (!override) return item;
      return {
        ...item,
        ...override,
      };
    });
  }, [ownedOpportunitySource, opportunityOverrides]);

  const ownedOpportunityIds = useMemo(
    () => new Set(ownedOpportunities.map((item) => item.id)),
    [ownedOpportunities],
  );

  const ownedOpportunityMap = useMemo(() => {
    return new Map(ownedOpportunities.map((item) => [item.id, item]));
  }, [ownedOpportunities]);

  const filteredApplicants = useMemo(() => {
    return APPLICANTS.filter((applicant) => {
      if (!ownedOpportunityIds.has(applicant.opportunityId)) {
        return false;
      }
      const status = applicantStatuses[applicant.id];
      if (applicantFilter !== "all" && status !== applicantFilter) return false;
      if (searchKeyword.trim().length === 0) return true;
      const keyword = searchKeyword.trim().toLowerCase();
      return (
        applicant.name.toLowerCase().includes(keyword) ||
        applicant.message.toLowerCase().includes(keyword)
      );
    });
  }, [applicantStatuses, applicantFilter, ownedOpportunityIds, searchKeyword]);

  const applicantStatusSummary = useMemo(() => {
    return filteredApplicants.reduce(
      (acc, applicant) => {
        const status = applicantStatuses[applicant.id];
        if (!status) return acc;
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
      } as Record<string, number>,
    );
  }, [applicantStatuses, filteredApplicants]);

  const filteredOpportunities = useMemo(() => {
    return ownedOpportunities.filter((item) => {
      if (opportunityStatusFilter !== "all" && item.status !== opportunityStatusFilter) {
        return false;
      }
      return matchesOpportunityFilters(item);
    });
  }, [matchesOpportunityFilters, opportunityStatusFilter, ownedOpportunities]);

  const opportunityStatusSummary = useMemo(
    () =>
      ownedOpportunities.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] ?? 0) + 1;
          return acc;
        },
        {
          open: 0,
          in_progress: 0,
          closed: 0,
        } as Record<OpportunityStatus, number>,
      ),
    [ownedOpportunities],
  );

  const upcomingOpportunities = useMemo(
    () =>
      [...ownedOpportunities]
        .filter((item) => item.status !== "closed")
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
        .slice(0, 3),
    [ownedOpportunities],
  );

  const mapOpportunities = useMemo(
    () =>
      filteredOpportunities.filter(
        (item) => item.status !== "closed" || opportunityStatusFilter === "closed",
      ),
    [filteredOpportunities, opportunityStatusFilter],
  );

  const prioritizedMapOpportunities = useMemo(
    () => {
      const statusOrder: Record<OpportunityStatus, number> = {
        open: 0,
        in_progress: 1,
        closed: 2,
      };
      return [...mapOpportunities].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status],
      );
    },
    [mapOpportunities],
  );

  const mapMarkers = useMemo(
    () =>
      mapOpportunities.map((item) => {
        const farmTypeLabel = item.farmTypes
          .map((value) => FARM_TYPE_LABEL_MAP[value] ?? value)
          .join("・");
        return {
          id: item.id,
          position: [item.location.lat, item.location.lng] as [number, number],
          title: item.title,
          description: `${item.location.address}${
            farmTypeLabel ? `・${farmTypeLabel}` : ""
          }・${item.rewardMiles} mile`,
        };
      }),
    [mapOpportunities],
  );

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    if (mapMarkers.length > 0) return mapMarkers[0].position;
    return undefined;
  }, [mapMarkers]);

  const mapPanelHeight = useBreakpointValue({ base: 320, md: 420, lg: 520 }) ?? 320;
  const mapListMaxHeight = useBreakpointValue({
    base: "45vh",
    md: "calc(100vh - 360px)",
  });

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
        description: "モック環境のため即時に反映されます。",
        status: "success",
      });
      profileModal.onClose();
    },
    [currentUser, profileModal, toast, updateProfile],
  );

  const handleChatOpen = (opportunityId: string) => {
    setChatFocusSignal({ id: opportunityId, nonce: Date.now() });
    setActiveTab("chat");
  };

  const fetchMileBalance = useCallback(async () => {
    if (!currentUser) return;
    setLoadingMileBalance(true);
    try {
      const balance = await mileApi.getBalance(currentUser.id);
      setMileBalance(balance);
    } catch (error) {
      console.error(error);
      toast({ title: "マイル残高の取得に失敗しました", status: "error" });
    } finally {
      setLoadingMileBalance(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (milesModal.isOpen && currentUser) {
      fetchMileBalance();
    }
  }, [milesModal.isOpen, currentUser, fetchMileBalance]);

  const fetchFarmlands = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await farmlandsApi.getFarmlands(currentUser.id);
      setFarmlands(data);
    } catch (error) {
      console.error(error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (createModal.isOpen && currentUser) {
      fetchFarmlands();
    }
  }, [createModal.isOpen, currentUser, fetchFarmlands]);

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

  const pendingCount = filteredApplicants.filter(
    (applicant) => applicantStatuses[applicant.id] === "pending",
  ).length;

  const handleApplicantAction = (id: string, status: string) => {
    setApplicantStatuses((prev) => ({ ...prev, [id]: status }));
    toast({
      title: "応募者のステータスを更新しました",
      description:
        status === "approved"
          ? "承認済みとして登録しました。参加者に通知されます。"
          : status === "rejected"
            ? "却下として登録しました。"
            : "審査中に戻しました。",
      status: status === "approved" ? "success" : status === "rejected" ? "error" : "info",
    });
  };

  const handleApplicantExport = useCallback(() => {
    toast({
      title: "応募者リストをエクスポートしました（モック）",
      description: "CSVファイルとしてダウンロードが開始された想定です。",
      status: "success",
    });
  }, [toast]);

  const handleApplicantBulkMessage = useCallback(() => {
    toast({
      title: "一括メッセージを送信しました（モック）",
      description: "応募者全員に通知メールを送信した想定です。",
      status: "info",
    });
  }, [toast]);

  const handleMockCreate = () => {
    createModal.onClose();
    toast({
      title: "募集を作成しました（モック）",
      description: "実際の保存は行われませんが、UI体験として記録されました。",
      status: "success",
    });
  };

  const canManageOpportunity = useCallback(
    (opportunity: Opportunity) => {
      if (!currentUser) return false;
      return (
        opportunity.owner.id === currentUser.id ||
        opportunity.managingFarmers.some((manager) => manager.id === currentUser.id)
      );
    },
    [currentUser],
  );

  const handleEditOpportunityOpen = useCallback(
    (opportunity: Opportunity) => {
      if (!canManageOpportunity(opportunity)) return;
      setEditingOpportunity(opportunity);
      setEditForm({
        title: opportunity.title,
        description: opportunity.description,
        startDate: opportunity.startDate,
        endDate: opportunity.endDate,
        rewardMiles: opportunity.rewardMiles.toString(),
      });
      editModal.onOpen();
    },
    [canManageOpportunity, editModal],
  );

  const handleEditModalClose = useCallback(() => {
    setEditingOpportunity(null);
    setEditForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      rewardMiles: "",
    });
    editModal.onClose();
  }, [editModal]);

  const handleEditOpportunitySubmit = useCallback(() => {
    if (!editingOpportunity) return;
    const trimmedTitle = editForm.title.trim();
    const rewardMilesValue = Number(editForm.rewardMiles);
    setOpportunityOverrides((prev) => ({
      ...prev,
      [editingOpportunity.id]: {
        title: trimmedTitle || editingOpportunity.title,
        description: editForm.description,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        rewardMiles: Number.isFinite(rewardMilesValue)
          ? rewardMilesValue
          : editingOpportunity.rewardMiles,
      },
    }));
    setActiveOpportunity((prev) =>
      prev && prev.id === editingOpportunity.id
        ? {
            ...prev,
            title: trimmedTitle || prev.title,
            description: editForm.description,
            startDate: editForm.startDate,
            endDate: editForm.endDate,
            rewardMiles: Number.isFinite(rewardMilesValue)
              ? rewardMilesValue
              : prev.rewardMiles,
          }
        : prev,
    );
    toast({
      title: "募集内容を更新しました（モック）",
      description: "変更内容はこのセッション内でのみ反映されます。",
      status: "success",
    });
    handleEditModalClose();
  }, [editForm, editingOpportunity, handleEditModalClose, toast]);

  const renderOpportunityCard = (item: Opportunity) => {
    const capacityRate = Math.round((item.capacity.filled / item.capacity.total) * 100);
    const statusLabel = OPPORTUNITY_STATUS_LABEL[item.status];
    const statusColor = OPPORTUNITY_STATUS_COLOR[item.status];
    const isManagedByCurrentUser = canManageOpportunity(item);
    const canEdit = isManagedByCurrentUser && item.status === "open";

    return (
      <Card key={item.id} variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <HStack justify="space-between" align="center">
              <Stack spacing={1}>
              <Text fontWeight="semibold">{item.title}</Text>
            <Text fontSize="sm" color="gray.600">
              {item.location.address}
            </Text>
              </Stack>
              <Badge colorScheme={statusColor}>{statusLabel}</Badge>
            </HStack>
            <Wrap spacing={2}>
              {item.farmTypes.map((tag) => (
                <WrapItem key={`${item.id}-farm-${tag}`}>
                  <Tag size="sm" colorScheme="green" variant="outline">
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
            <HStack fontSize="sm" justify="space-between" alignItems="baseline">
              <Text>
                期間: {item.startDate} 〜 {item.endDate}
              </Text>
              <Text color="green.600" fontWeight="semibold">
                {item.rewardMiles} mile
              </Text>
            </HStack>
            <Stack spacing={1}>
              <Text fontSize="xs" color="gray.500">
                応募状況: {item.capacity.filled}/{item.capacity.total} 名
              </Text>
              <Progress value={capacityRate} size="sm" borderRadius="full" colorScheme="green" />
            </Stack>
            <Stack spacing={1}>
              <Text fontSize="xs" color="gray.500">
                担当農家の分担
              </Text>
              <Stack spacing={1}>
                {item.managingFarmers.map((manager) => (
                  <HStack key={`${item.id}-manager-${manager.id}`} justify="space-between">
                    <HStack spacing={2}>
                      <Avatar size="xs" name={manager.name} src={manager.avatarUrl} />
                      <Text fontSize="sm">{manager.name}</Text>
                      <Badge colorScheme="green" variant="subtle">
                        {manager.role}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {manager.sharePercentage}%
                    </Text>
                  </HStack>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </CardBody>
        <CardFooter pt={0}>
          <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full">
            {canEdit ? (
              <Button
                size="sm"
                colorScheme="green"
                variant="solid"
                w="full"
                onClick={() => handleEditOpportunityOpen(item)}
              >
                募集内容を編集
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              w="full"
              onClick={() => handleOpportunityOpen(item)}
            >
              詳細を見る
            </Button>
            <Button
              size="sm"
              colorScheme="teal"
              variant="solid"
              w="full"
              leftIcon={<FiMessageCircle />}
              onClick={() => handleChatOpen(item.id)}
            >
              チャット
            </Button>
          </Stack>
        </CardFooter>
      </Card>
    );
  };

  const activeOpportunityCount =
    opportunityStatusSummary.open + opportunityStatusSummary.in_progress;

  const homeContent = (
    <Stack spacing={6}>
      <Stack spacing={1}>
        <Heading size="md">こんにちは、{profileInitialValue.name ?? "ファーマー"} さん</Heading>
        <Text color="gray.600" fontSize="sm">
          運用中 {activeOpportunityCount} 件（公開中 {opportunityStatusSummary.open} 件・調整中{" "}
          {opportunityStatusSummary.in_progress} 件）の募集と、審査待ち応募 {pendingCount} 名を確認できます。
        </Text>
      </Stack>

      {onboardingGuide.isOpen ? (
        <Alert
          status="success"
          borderRadius="lg"
          borderWidth="1px"
          alignItems="flex-start"
          bg="green.50"
        >
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">運用のベストプラクティス</AlertTitle>
            <AlertDescription fontSize="sm">
              募集作成から当日運営、振り返りまでの流れをステップで確認できます。
            </AlertDescription>
            <Stepper size="sm" index={0} mt={4} gap="0">
              {FARMER_ONBOARDING_STEPS.map((step) => (
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
            onClick={onboardingGuide.onClose}
            aria-label="オンボーディングを閉じる"
          />
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard
          key="open"
          label="公開中"
          value={opportunityStatusSummary.open}
          unit="件"
          icon={<FiTrendingUp color="#047857" />}
        />
        <StatCard
          key="in_progress"
          label="調整中"
          value={opportunityStatusSummary.in_progress}
          unit="件"
          icon={<FiClipboard color="#047857" />}
        />
        <StatCard
          key="pending"
          label="審査待ち応募"
          value={applicantStatusSummary.pending}
          unit="名"
          icon={<FiMessageCircle color="#047857" />}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card variant="outline" borderRadius="xl">
          <CardHeader>
            <Heading size="sm">クイックアクション</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Stack spacing={3}>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiPlusCircle />}
                colorScheme="green"
                variant="solid"
                onClick={createModal.onOpen}
              >
                募集を新規作成
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiClipboard />}
                variant="outline"
                colorScheme="green"
                onClick={() => setOpportunityStatusFilter("in_progress")}
              >
                テンプレートから複製
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiTrendingUp />}
                variant="ghost"
                colorScheme="green"
                onClick={milesModal.onOpen}
              >
                マイル運用を確認
              </Button>
            </Stack>
          </CardBody>
        </Card>
        <Card variant="outline" borderRadius="xl">
          <CardHeader>
            <Heading size="sm">直近のスケジュール</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Stack spacing={3}>
              {upcomingOpportunities.length === 0 ? (
                <Text fontSize="sm" color="gray.600">
                  公開中の募集はまだありません。新しい募集を作成しましょう。
                </Text>
              ) : (
                upcomingOpportunities.map((item) => (
                  <Stack
                    key={item.id}
                    spacing={1}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="green.100"
                    p={3}
                    bg="green.50"
                  >
                    <HStack justify="space-between" align="center">
                      <Text fontWeight="semibold">{item.title}</Text>
                      <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[item.status]}>
                        {OPPORTUNITY_STATUS_LABEL[item.status]}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {item.startDate} 〜 {item.endDate}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {item.location.address}
                    </Text>
                  </Stack>
                ))
              )}
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="sm">募集一覧を絞り込む</Heading>
            <Button size="sm" variant="ghost" onClick={resetOpportunityFilters}>
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
                value={searchOpportunityKeyword}
                onChange={(event) => setSearchOpportunityKeyword(event.target.value)}
                placeholder="キーワードで検索（例：ドローン / 稲刈り）"
              />
            </InputGroup>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">ステータス</FormLabel>
                <Select
                  value={opportunityStatusFilter}
                  onChange={(event) =>
                    setOpportunityStatusFilter(event.target.value as OpportunityStatusFilter)
                  }
                >
                  <option value="all">すべて</option>
                  <option value="open">募集中</option>
                  <option value="in_progress">募集済み</option>
                  <option value="closed">完了済み</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">農場タイプ</FormLabel>
                <Wrap spacing={2}>
                  {FARMER_FARM_TYPE_OPTIONS.map((option) => {
                    const isActive = selectedOpportunityFarmTypes.includes(option.value);
                    return (
                      <WrapItem key={option.value}>
                        <Button
                          size="xs"
                          variant={isActive ? "solid" : "outline"}
                          colorScheme="green"
                          onClick={() => toggleOpportunityFarmType(option.value)}
                        >
                          {option.label}
                        </Button>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </FormControl>
            </SimpleGrid>
            <Stack spacing={2}>
              <FormLabel fontSize="sm">興味タグ</FormLabel>
              <Wrap spacing={2}>
                {INTEREST_FARMING_OPTIONS.map((option) => {
                  const isActive = selectedOpportunityInterests.includes(option.value);
                  return (
                    <WrapItem key={option.value}>
                      <Button
                        size="xs"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme="teal"
                        onClick={() => toggleOpportunityInterest(option.value)}
                      >
                        {option.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Stack>
            <Stack spacing={2}>
              <FormLabel fontSize="sm">働き方タグ</FormLabel>
              <Wrap spacing={2}>
                {INTEREST_WORKSTYLE_OPTIONS.map((option) => {
                  const isActive = selectedOpportunityWorkstyles.includes(option.value);
                  return (
                    <WrapItem key={option.value}>
                      <Button
                        size="xs"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme="purple"
                        onClick={() => toggleOpportunityWorkstyle(option.value)}
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

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="sm">保有農場マップ</Heading>
            <Button
              leftIcon={<FiPlusCircle />}
              size="sm"
              colorScheme="green"
              onClick={createModal.onOpen}
            >
              募集を作成
            </Button>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <LeafletMap
            markers={mapMarkers}
            height={320}
            zoom={12}
            center={mapCenter}
            onMarkerClick={handleMarkerSelect}
            selectedMarkerId={selectedOpportunityId}
            showPopups={false}
          />
        </CardBody>
      </Card>

      <Stack spacing={3}>
        <Heading size="sm">現在公開中の募集</Heading>
        {filteredOpportunities.length === 0 ? (
          <Card variant="outline" borderRadius="xl">
            <CardBody>
              <Text fontSize="sm" color="gray.600">
                条件に一致する募集が見つかりませんでした。フィルターを調整してください。
              </Text>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {filteredOpportunities.map((item) => renderOpportunityCard(item))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );

  const activeContent = (
    <Stack spacing={6}>
      <Stack spacing={1}>
        <Heading size="md">応募者管理</Heading>
        <Text fontSize="sm" color="gray.600">
          審査待ち {applicantStatusSummary.pending} 名・承認済み{" "}
          {applicantStatusSummary.approved} 名・却下 {applicantStatusSummary.rejected} 名です。
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard
          key="pending-applicants"
          label="審査待ち"
          value={applicantStatusSummary.pending}
          unit="名"
          icon={<FiClipboard color="#047857" />}
        />
        <StatCard
          key="approved-applicants"
          label="承認済み"
          value={applicantStatusSummary.approved}
          unit="名"
          icon={<FiTrendingUp color="#047857" />}
        />
        <StatCard
          key="rejected-applicants"
          label="却下"
          value={applicantStatusSummary.rejected}
          unit="名"
          icon={<FiFilter color="#047857" />}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Card variant="outline" borderRadius="xl">
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="sm">フィルター</Heading>
              <Badge colorScheme="green" variant="subtle">
                審査中 {pendingCount} 名
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">ステータス</FormLabel>
                  <Select
                    value={applicantFilter}
                    onChange={(event) =>
                      setApplicantFilter(event.target.value as string | "all")
                    }
                  >
                    <option value="all">すべて</option>
                    <option value="pending">審査中</option>
                    <option value="approved">承認済み</option>
                    <option value="rejected">却下</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">キーワード</FormLabel>
                  <Input
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="名前・メッセージで検索"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">審査待ち</FormLabel>
                  <Button
                    variant="outline"
                    colorScheme="green"
                    w="full"
                    onClick={() => setApplicantFilter("pending")}
                  >
                    審査中 {pendingCount} 件
                  </Button>
                </FormControl>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500">
                絞り込んだ結果はテーブル下部のエクスポートからCSVに出力できます。
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card variant="outline" borderRadius="xl">
          <CardHeader>
            <Heading size="sm">コミュニケーション</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Stack spacing={3}>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiMessageCircle />}
                colorScheme="green"
                variant="solid"
                onClick={handleApplicantBulkMessage}
              >
                審査中全員にリマインド送信
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiClipboard />}
                variant="outline"
                colorScheme="green"
                onClick={handleApplicantExport}
              >
                応募者リストをCSV出力
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FiMessageCircle />}
                variant="ghost"
                colorScheme="green"
                onClick={() => setActiveTab("chat")}
              >
                チャット画面を開く
              </Button>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card variant="outline" borderRadius="xl">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="sm">応募者一覧</Heading>
            <Badge colorScheme="gray" variant="subtle">
              全 {APPLICANTS.length} 名
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Box borderRadius="lg" borderWidth="1px" overflow="hidden" bg="white">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>応募者</Th>
                  <Th>応募案件</Th>
                  <Th>メッセージ</Th>
                  <Th>ステータス</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {filteredApplicants.map((applicant) => {
                  const status = applicantStatuses[applicant.id];
                  const applicantStatus = (status ?? "pending") as ApplicantStatus;
                  const badge = STATUS_BADGE[applicantStatus];
                  const opportunity = ownedOpportunityMap.get(applicant.opportunityId);

                  return (
                    <Tr key={applicant.id}>
                      <Td>
                        <Stack spacing={1}>
                          <Text fontWeight="semibold">{applicant.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {applicant.profile.age}歳・{applicant.profile.occupation}・
                            {applicant.profile.location}
                          </Text>
                        </Stack>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{opportunity?.title ?? "不明な募集"}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {opportunity?.location.prefecture} {opportunity?.location.city}
                        </Text>
                      </Td>
                      <Td maxW="320px">
                        <Text fontSize="sm" noOfLines={2}>
                          {applicant.message}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={badge.color}>{badge.label}</Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplicantAction(applicant.id, "pending")}
                          >
                            保留
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            onClick={() => handleApplicantAction(applicant.id, "approved")}
                          >
                            承認
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleApplicantAction(applicant.id, "rejected")}
                          >
                            却下
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </Stack>
  );

  const mapContent = (
    <Flex direction={{ base: "column", xl: "row" }} gap={4} minH="calc(100vh - 200px)">
      <Stack flex="1" spacing={4}>
        <HStack justify="space-between" align="center">
          <Heading size="md">農場マップ</Heading>
          <Select
            w={{ base: "60%", md: "240px" }}
            value={opportunityStatusFilter}
            onChange={(event) =>
              setOpportunityStatusFilter(event.target.value as OpportunityStatusFilter)
            }
          >
            <option value="all">すべて表示</option>
            <option value="open">募集中のみ</option>
            <option value="in_progress">募集済みのみ</option>
            <option value="closed">完了済みのみ</option>
          </Select>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          ピンをクリックすると詳細モーダルが開きます。募集状況別に色分けされています。
        </Text>
        <Box
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          h={`${mapPanelHeight}px`}
        >
          <LeafletMap
            markers={mapMarkers}
            height={mapPanelHeight}
            zoom={12}
            center={mapCenter}
            onMarkerClick={handleMarkerSelect}
            selectedMarkerId={selectedOpportunityId}
            showPopups={false}
            invalidateSizeKey={`${activeTab}-${mapMarkers.length}`}
          />
        </Box>
      </Stack>
      <Card
        variant="outline"
        borderRadius="xl"
        flex={{ base: "unset", xl: "0 0 360px" }}
        maxH={mapListMaxHeight ?? "100%"}
      >
        <CardHeader>
          <Heading size="sm">マップ表示中の募集</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <Stack
            spacing={3}
            maxH={mapListMaxHeight ?? "calc(100vh - 360px)"}
            overflowY="auto"
            pr={1}
          >
            {prioritizedMapOpportunities.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                条件に一致する募集がありません。
              </Text>
            ) : (
              prioritizedMapOpportunities.map((item) => (
                <Card
                  key={item.id}
                  variant="outline"
                  borderRadius="lg"
                  borderColor={
                    selectedOpportunityId === item.id ? "green.400" : "gray.200"
                  }
                  bg={selectedOpportunityId === item.id ? "green.50" : "white"}
                >
                  <CardBody>
                    <Stack spacing={2}>
                      <HStack justify="space-between" align="center">
                        <Stack spacing={0}>
                          <Text fontWeight="semibold">{item.title}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.location.address}
                          </Text>
                        </Stack>
                        <Badge colorScheme={OPPORTUNITY_STATUS_COLOR[item.status]}>
                          {OPPORTUNITY_STATUS_LABEL[item.status]}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        担当: {item.managingFarmers.map((manager) => manager.name).join(" / ")}
                      </Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="green"
                          onClick={() => handleOpportunityOpen(item)}
                        >
                          詳細
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<FiMessageCircle />}
                          colorScheme="green"
                          onClick={() => handleChatOpen(item.id)}
                        >
                          チャット
                        </Button>
                      </HStack>
                    </Stack>
                  </CardBody>
                </Card>
              ))
            )}
          </Stack>
        </CardBody>
      </Card>
    </Flex>
  );

  const chatContent = (
    <Stack spacing={4}>
      <Heading size="md">チャット・連絡</Heading>
      <Text fontSize="sm" color="gray.600">
        応募者とのDMや案件単位のグループ連絡、一斉送信をまとめて管理できます。フィルターとモーダルで目的の相手に素早く連絡しましょう。
      </Text>
      <FarmerChatCenter
        farmerId={currentUser?.id ?? "farmer-001"}
        farmerDisplayName={profileInitialValue.name || currentUser?.name || "農家"}
        focusSignal={chatFocusSignal}
        onUnreadChange={setChatUnreadCount}
      />
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
      kycStatus: currentUser?.kycStatus ?? "approved",
    }),
    [currentUser, profileInitialValue],
  );

  const completedOpportunities = useMemo(
    () => ownedOpportunities.filter((item) => item.status === "closed"),
    [ownedOpportunities],
  );

  const completedMarkers = useMemo(
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
                  {profileSummary.location}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  保有マイル: {(currentUser?.miles ?? 0).toLocaleString()} mile
                </Text>
                {profileSummary.catchphrase ? (
                  <Box bg="green.50" borderRadius="lg" p={3} mt={2}>
                    <Text fontSize="xs" color="green.700">
                      {profileSummary.catchphrase}
                    </Text>
                  </Box>
                ) : null}
              </Stack>
            </HStack>
            <HStack spacing={3}>
              <Button
                colorScheme="green"
                leftIcon={<FiUser />}
                onClick={profileModal.onOpen}
              >
                プロフィールを編集
              </Button>
              <Button
                variant="outline"
                colorScheme="green"
                leftIcon={<FiTrendingUp />}
                onClick={milesModal.onOpen}
              >
                マイル残高を見る
              </Button>
            </HStack>
          </Stack>
        </CardBody>
      </Card>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <Text fontWeight="semibold">基本情報</Text>
            <Text fontSize="sm">性別: {GENDER_OPTIONS.find((option) => option.value === profileSummary.gender)?.label ?? "未設定"}</Text>
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
                      <Tag size="sm" colorScheme="green" variant="subtle">
                        {INTEREST_LABEL_MAP[tag] ??
                          WORKSTYLE_LABEL_MAP[tag] ??
                          tag}
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
            <HStack justify="space-between">
              <Text fontWeight="semibold">農地管理</Text>
              <Button size="sm" colorScheme="green" onClick={farmlandModal.onOpen}>
                農地を管理
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.600">
              登録済みの農地は募集作成時に選択できます。
            </Text>
          </Stack>
        </CardBody>
      </Card>
      <Card variant="outline" borderRadius="xl">
        <CardBody>
          <Stack spacing={3}>
            <Text fontWeight="semibold">本人確認ステータス</Text>
            <Badge colorScheme={profileSummary.kycStatus === "approved" ? "green" : "yellow"} w="fit-content">
              {profileSummary.kycStatus === "approved" ? "承認済み" : profileSummary.kycStatus === "pending" ? "審査中" : "未提出"}
            </Badge>
            <FormControl>
              <FormLabel fontSize="sm">通知設定</FormLabel>
              <FormHelperText fontSize="xs">
                重要な更新はメールとアプリ通知でお知らせします。
              </FormHelperText>
              <Button variant="outline" colorScheme="green" mt={2}>
                通知設定を確認する
              </Button>
            </FormControl>
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
                  markers={completedMarkers}
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

  const contentByTab: Record<FarmerTab, JSX.Element> = {
    home: homeContent,
    active: activeContent,
    map: mapContent,
    chat: chatContent,
    profile: profileContent,
  };

  const unreadChatCount = chatUnreadCount;

  const bottomNavigationItems = useMemo(
    () => [
      { key: "home", label: "ホーム", icon: <FiHome /> },
      {
        key: "active",
        label: "応募管理",
        icon: <FiClipboard />,
        badgeCount: pendingCount > 0 ? pendingCount : undefined,
      },
      { key: "map", label: "マップ", icon: <FiMap /> },
      {
        key: "chat",
        label: "チャット",
        icon: <FiMessageCircle />,
        badgeCount: unreadChatCount > 0 ? unreadChatCount : undefined,
      },
      { key: "profile", label: "プロフィール", icon: <FiUser /> },
    ],
    [pendingCount, unreadChatCount],
  );

  return (
    <Flex direction="column" minH="100vh" pb={28} gap={4}>
      <Box flex="1" px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 6, md: 10 }}>
        {contentByTab[activeTab]}
      </Box>
      <BottomNavigation
        items={bottomNavigationItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as FarmerTab)}
      />
      <ProfileEditorModal
        isOpen={profileModal.isOpen}
        onClose={profileModal.onClose}
        onSubmit={handleProfileSubmit}
        initialValue={profileInitialValue}
        role="farmer"
      />
      <Modal isOpen={milesModal.isOpen} onClose={milesModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>マイルサマリー</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingMileBalance ? (
              <Stack align="center" py={8}>
                <Text>読み込み中...</Text>
              </Stack>
            ) : (
              <Stack spacing={4}>
                <Stack spacing={1}>
                  <Text fontSize="sm" color="gray.500">
                    保有マイル
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {(mileBalance?.totalMiles ?? 0).toLocaleString()} mile
                  </Text>
                </Stack>
                <Stack spacing={2}>
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">
                    最近のトランザクション
                  </Text>
                  {mileBalance && mileBalance.transactions.length > 0 ? (
                    <Box borderRadius="lg" borderWidth="1px" overflow="hidden">
                      <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>日時</Th>
                            <Th>種類</Th>
                            <Th>説明</Th>
                            <Th isNumeric>変動</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {mileBalance.transactions.slice(0, 10).map((tx) => (
                            <Tr key={tx.id}>
                              <Td fontSize="xs">
                                {new Date(tx.createdAt).toLocaleDateString("ja-JP")}
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={
                                    tx.type === "earn" ? "green" : tx.type === "spend" ? "red" : "blue"
                                  }
                                  fontSize="xs"
                                >
                                  {tx.type === "earn" ? "獲得" : tx.type === "spend" ? "消費" : "交換"}
                                </Badge>
                              </Td>
                              <Td fontSize="xs">{tx.description}</Td>
                              <Td isNumeric fontSize="xs" color={tx.amount >= 0 ? "green.600" : "red.600"}>
                                {tx.amount >= 0 ? "+" : ""}
                                {tx.amount.toLocaleString()} mile
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      トランザクション履歴がありません。
                    </Text>
                  )}
                </Stack>
                <Stack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    交換メニュー
                  </Text>
                  {FARMER_MILE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      justifyContent="space-between"
                      rightIcon={<FiTrendingUp />}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={milesModal.onClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
                <Text fontSize="sm" color="gray.700">
                  {activeOpportunity.description}
                </Text>
                {(activeOpportunity as any).farmland?.imageUrl && (
                  <Box borderRadius="md" overflow="hidden">
                    <Image
                      src={(activeOpportunity as any).farmland.imageUrl}
                      alt={(activeOpportunity as any).farmland?.name || "農地画像"}
                      w="100%"
                      maxH="300px"
                      objectFit="cover"
                    />
                  </Box>
                )}
                <Stack spacing={1} fontSize="sm" color="gray.600">
                  <Text>
                    期間: {activeOpportunity.startDate} 〜 {activeOpportunity.endDate}
                  </Text>
                  <Text>所在地: {activeOpportunity.location.address}</Text>
                  {(activeOpportunity as any).farmland && (
                    <Text>
                      実施農地: {(activeOpportunity as any).farmland.name} - {(activeOpportunity as any).farmland.prefecture} {(activeOpportunity as any).farmland.city}
                    </Text>
                  )}
                  <Text>報酬: {activeOpportunity.rewardMiles} mile</Text>
                  <Text>
                    応募状況: {activeOpportunity.capacity.filled}/
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
            <Button
              colorScheme="green"
              onClick={() => {
                setActiveTab("active");
                mapDetailModal.onClose();
              }}
            >
              応募管理を開く
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={editModal.isOpen} onClose={handleEditModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>募集を編集（モック）</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>募集タイトル</FormLabel>
                <Input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="募集タイトルを入力"
                />
              </FormControl>
              <FormControl>
                <FormLabel>募集概要</FormLabel>
                <Textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="募集の詳細を入力"
                  minH="120px"
                />
              </FormControl>
              <FormControl>
                <FormLabel>実施期間</FormLabel>
                <HStack>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                  />
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel>マイル報酬</FormLabel>
                <Input
                  type="number"
                  min="0"
                  value={editForm.rewardMiles}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, rewardMiles: event.target.value }))
                  }
                  placeholder="例: 1500"
                />
              </FormControl>
              <Text fontSize="xs" color="gray.500">
                変更内容はモック環境のため実際のデータには保存されません。
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleEditModalClose}>
              キャンセル
            </Button>
            <Button
              colorScheme="green"
              onClick={handleEditOpportunitySubmit}
              isDisabled={!editingOpportunity}
            >
              更新する
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>募集を作成（モック）</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>募集タイトル</FormLabel>
                <Input placeholder="例：秋の果物収穫サポート" />
              </FormControl>
              <FormControl>
                <FormLabel>実施農地</FormLabel>
                <Select
                  placeholder="農地を選択（プロフィールで登録済みの農地）"
                  value={selectedFarmlandId}
                  onChange={(e) => setSelectedFarmlandId(e.target.value)}
                >
                  {farmlands.map((farmland) => (
                    <option key={farmland.id} value={farmland.id}>
                      {farmland.name} - {farmland.prefecture} {farmland.city}
                    </option>
                  ))}
                </Select>
                <FormHelperText fontSize="xs">
                  プロフィールで農地を登録していない場合は、手動で入力してください。
                </FormHelperText>
              </FormControl>
              {selectedFarmlandId && (
                <FormControl>
                  <FormLabel>実施地域（自動入力）</FormLabel>
                  <Input
                    value={
                      farmlands.find((f) => f.id === selectedFarmlandId)?.address ||
                      ""
                    }
                    readOnly
                    bg="gray.50"
                  />
                </FormControl>
              )}
              {!selectedFarmlandId && (
                <FormControl>
                  <FormLabel>実施地域（手動入力）</FormLabel>
                  <Input placeholder="例：愛知県 豊橋市石巻町" />
                </FormControl>
              )}
              <FormControl>
                <FormLabel>実施期間</FormLabel>
                <HStack>
                  <Input type="date" />
                  <Input type="date" />
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel>マイル報酬</FormLabel>
                <Select placeholder="報酬を選択">
                  <option value="800">800 mile</option>
                  <option value="1200">1200 mile</option>
                  <option value="1500">1500 mile</option>
                </Select>
              </FormControl>
              <Text fontSize="xs" color="gray.500">
                入力内容はローカルに保存されません。作成後に確認トーストのみ表示されます。
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createModal.onClose}>
              キャンセル
            </Button>
            <Button colorScheme="green" onClick={handleMockCreate}>
              作成
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <FarmlandManager
        farmerId={currentUser?.id ?? "farmer-001"}
        isOpen={farmlandModal.isOpen}
        onClose={farmlandModal.onClose}
      />
    </Flex>
  );
}
