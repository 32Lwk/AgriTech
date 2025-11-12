"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { FieldPath } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { useAuth } from "@/features/auth/AuthContext";
import {
  GENDER_OPTIONS,
  EXPERIENCE_ROLE_OPTIONS,
  INTEREST_FARMING_BASE_OPTIONS,
  INTEREST_FARMING_EXTRA_OPTIONS,
  INTEREST_FARMING_OPTIONS,
  INTEREST_WORKSTYLE_BASE_OPTIONS,
  INTEREST_WORKSTYLE_EXTRA_OPTIONS,
  INTEREST_WORKSTYLE_OPTIONS,
  LOCATION_OPTIONS,
  OCCUPATION_OPTIONS,
  FARMER_FARM_TYPE_OPTIONS,
  FARMER_BUSY_SEASON_OPTIONS,
  FARMER_RECRUITMENT_SIZE_OPTIONS,
} from "@/constants/profile";
import type { UserRole } from "@/features/auth/types";
import { readFileAsDataUrl } from "@/utils/file";

const loginSchema = z.object({
  email: z
    .string()
    .nonempty("メールアドレスを入力してください。")
    .refine(
      (value) => value === "admin" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "メールアドレスの形式が不正です。",
    ),
  password: z
    .string()
    .nonempty("パスワードを入力してください。")
    .min(6, "パスワードは6文字以上で入力してください。"),
});

const registerSchema = z.object({
  name: z.string().min(1, "氏名を入力してください。"),
  email: z.string().min(1, "メールアドレスを入力してください。").email("メールアドレスの形式が不正です。"),
  password: z.string().min(1, "パスワードを入力してください。").min(6, "パスワードは6文字以上で入力してください。"),
  location: z.string().min(1, "希望する勤務地域を選択してください。"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  birthDate: z
    .string()
    .min(1, "生年月日を入力してください。")
    .transform((value) => normalizeBirthDateInput(value))
    .refine(
      (value) =>
        value !== "" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(new Date(value).getTime()),
      "有効な生年月日(YYYY-MM-DD)を入力してください。",
    ),
  occupation: z.string().min(1, "職業を選択してください。"),
  role: z.enum(["worker", "farmer", "admin"]),
  interests: z.array(z.string()).default([]),
  catchphrase: z.string().max(60, "一言は60文字以内で入力してください。").optional(),
  avatarUrl: z.string().optional(),
  farmerPostalCode: z.string().default(""),
  farmerPrefecture: z.string().default(""),
  farmerCity: z.string().default(""),
  farmerAddressLine1: z.string().default(""),
  farmerAddressLine2: z.string().default(""),
  farmerFarmTypes: z.array(z.string()).default([]),
  farmerBusySeasons: z.array(z.string()).default([]),
  farmerRecruitmentSize: z.string().default(""),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const STEP1_FIELDS: FieldPath<RegisterFormValues>[] = [
  "name",
  "email",
  "password",
  "gender",
  "birthDate",
  "occupation",
  "location",
];

const STEP2_WORKER_FIELDS: FieldPath<RegisterFormValues>[] = ["role", "interests"];

const STEP2_FARMER_FIELDS: FieldPath<RegisterFormValues>[] = [
  "role",
  "farmerPostalCode",
  "farmerPrefecture",
  "farmerCity",
  "farmerAddressLine1",
  "farmerFarmTypes",
  "farmerBusySeasons",
  "farmerRecruitmentSize",
];

const STEP1_SCHEMA = registerSchema.pick({
  name: true,
  email: true,
  password: true,
  gender: true,
  birthDate: true,
  occupation: true,
  location: true,
});

const STEP2_WORKER_SCHEMA = z.object({
  role: registerSchema.shape.role,
  interests: z.array(z.string()).optional(),
});

const STEP2_FARMER_SCHEMA = z.object({
  role: registerSchema.shape.role,
  farmerPostalCode: z
    .string()
    .min(1, "郵便番号を入力してください。")
    .regex(/^\d{7}$/, "郵便番号はハイフンなし7桁で入力してください。"),
  farmerPrefecture: z.string().min(1, "都道府県を入力してください。"),
  farmerCity: z.string().min(1, "市区町村を入力してください。"),
  farmerAddressLine1: z.string().min(1, "丁目・番地などを入力してください。"),
  farmerAddressLine2: z.string().optional(),
  farmerFarmTypes: z.array(z.string()).min(1, "少なくとも1つ選択してください。"),
  farmerBusySeasons: z.array(z.string()).min(1, "少なくとも1つ選択してください。"),
  farmerRecruitmentSize: z.string().min(1, "募集人数を選択してください。"),
});

const getStepFields = (step: 1 | 2, role: UserRole): FieldPath<RegisterFormValues>[] => {
  if (step === 1) return STEP1_FIELDS;
  return role === "farmer" ? STEP2_FARMER_FIELDS : STEP2_WORKER_FIELDS;
};

const getStepSchema = (step: 1 | 2, role: UserRole) => {
  if (step === 1) return STEP1_SCHEMA;
  return role === "farmer" ? STEP2_FARMER_SCHEMA : STEP2_WORKER_SCHEMA;
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date();
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return 0;
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(age, 0);
};

const normalizeBirthDateInput = (value: string) => {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length >= 8) {
    const year = digitsOnly.slice(0, 4);
    const month = digitsOnly.slice(4, 6);
    const day = digitsOnly.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
  return value.replace(/[./]/g, "-");
};

const renderFieldError = (message?: string) => {
  if (!message) return null;
  return (
    <FormErrorMessage>
      <Box
        w="full"
        bg="red.50"
        color="red.700"
        borderRadius="md"
        px={3}
        py={2}
        fontSize="sm"
        fontWeight="semibold"
      >
        {message}
      </Box>
    </FormErrorMessage>
  );
};

export default function LoginPage() {
  const toast = useToast();
  const router = useRouter();
  const { login, register, loginWithProvider, submitKycRequest, users } = useAuth();
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [kycFileName, setKycFileName] = useState<string | null>(null);
  const [isFarmerSelectOpen, setFarmerSelectOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      location: "",
      gender: "prefer_not_to_say",
      birthDate: "",
      occupation: "",
      role: "worker",
      interests: [],
      catchphrase: "",
      avatarUrl: "",
      farmerPostalCode: "",
      farmerPrefecture: "",
      farmerCity: "",
      farmerAddressLine1: "",
      farmerAddressLine2: "",
      farmerFarmTypes: [],
      farmerBusySeasons: [],
      farmerRecruitmentSize: "",
    },
  });

  const farmerAccounts = useMemo(
    () => users.filter((user) => user.role === "farmer"),
    [users],
  );

  const [showAllFarmingTags, setShowAllFarmingTags] = useState(false);
  const [showAllWorkstyleTags, setShowAllWorkstyleTags] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const selectedRole = (registerForm.watch("role") as UserRole) ?? "worker";
  const selectedInterests = registerForm.watch("interests") ?? [];
  const farmerPostalCode = registerForm.watch("farmerPostalCode") ?? "";
  const postalCodeField = registerForm.register("farmerPostalCode");
  const avatarPreview = registerForm.watch("avatarUrl") ?? "";
  const registerCatchphrase = registerForm.watch("catchphrase") ?? "";

  const farmingOptionsToDisplay = useMemo(() => {
    if (showAllFarmingTags) {
      return INTEREST_FARMING_OPTIONS;
    }
    const base = INTEREST_FARMING_BASE_OPTIONS;
    const extraSelected = INTEREST_FARMING_EXTRA_OPTIONS.filter(
      (option) =>
        selectedInterests.includes(option.value) &&
        !base.some((baseOption) => baseOption.value === option.value),
    );
    return [...base, ...extraSelected];
  }, [selectedInterests, showAllFarmingTags]);

  const workstyleOptionsToDisplay = useMemo(() => {
    if (showAllWorkstyleTags) {
      return INTEREST_WORKSTYLE_OPTIONS;
    }
    const base = INTEREST_WORKSTYLE_BASE_OPTIONS;
    const extraSelected = INTEREST_WORKSTYLE_EXTRA_OPTIONS.filter(
      (option) =>
        selectedInterests.includes(option.value) &&
        !base.some((baseOption) => baseOption.value === option.value),
    );
    return [...base, ...extraSelected];
  }, [selectedInterests, showAllWorkstyleTags]);

  useEffect(() => {
    if (!showAllFarmingTags && selectedInterests.length >= INTEREST_FARMING_BASE_OPTIONS.length) {
      setShowAllFarmingTags(true);
    }
    const hasSelectedFarmingExtra = selectedInterests.some((value) =>
      INTEREST_FARMING_EXTRA_OPTIONS.some((option) => option.value === value),
    );
    if (!showAllFarmingTags && hasSelectedFarmingExtra) {
      setShowAllFarmingTags(true);
    }
  }, [selectedInterests, showAllFarmingTags]);

  useEffect(() => {
    if (!showAllWorkstyleTags && selectedInterests.length >= INTEREST_WORKSTYLE_BASE_OPTIONS.length) {
      setShowAllWorkstyleTags(true);
    }
    const hasSelectedWorkstyleExtra = selectedInterests.some((value) =>
      INTEREST_WORKSTYLE_EXTRA_OPTIONS.some((option) => option.value === value),
    );
    if (!showAllWorkstyleTags && hasSelectedWorkstyleExtra) {
      setShowAllWorkstyleTags(true);
    }
  }, [selectedInterests, showAllWorkstyleTags]);

  useEffect(() => {
    if (selectedRole !== "farmer") {
      registerForm.clearErrors([
        "farmerPostalCode",
        "farmerPrefecture",
        "farmerCity",
        "farmerAddressLine1",
        "farmerFarmTypes",
        "farmerBusySeasons",
        "farmerRecruitmentSize",
      ]);
    }
  }, [selectedRole, registerForm]);

  useEffect(() => {
    if (registerStep !== 2 || selectedRole !== "farmer") {
      setIsFetchingAddress(false);
      return;
    }
    if (!farmerPostalCode || farmerPostalCode.length !== 7) {
      setPostalCodeError(null);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchAddress = async () => {
      setIsFetchingAddress(true);
      setPostalCodeError(null);
      try {
        const response = await fetch(
          `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${farmerPostalCode}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("failed");
        }
        const data = await response.json();
        if (!isActive) return;
        if (data.status !== 200 || !data.results || data.results.length === 0) {
          setPostalCodeError("該当する住所が見つかりませんでした。");
          return;
        }
        const result = data.results[0];
        const prefecture = result?.address1 ?? "";
        const city = `${result?.address2 ?? ""}${result?.address3 ?? ""}`;
        if (!prefecture || !city) {
          setPostalCodeError("住所の取得に失敗しました。");
          return;
        }
        const prefectureState = registerForm.getFieldState("farmerPrefecture");
        const cityState = registerForm.getFieldState("farmerCity");
        if (!prefectureState.isDirty) {
          registerForm.setValue("farmerPrefecture", prefecture, {
            shouldDirty: false,
          });
        }
        if (!cityState.isDirty) {
          registerForm.setValue("farmerCity", city, {
            shouldDirty: false,
          });
        }
        registerForm.clearErrors(["farmerPostalCode", "farmerPrefecture", "farmerCity"]);
      } catch (error) {
        if (!isActive) {
          return;
        }
        const err = error as { name?: string };
        if (err?.name === "AbortError") {
          return;
        }
        setPostalCodeError("郵便番号の検索に失敗しました。");
      } finally {
        if (isActive) {
          setIsFetchingAddress(false);
        }
      }
    };

    fetchAddress();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [farmerPostalCode, selectedRole, registerForm, registerStep]);

  const birthDateRaw = registerForm.watch("birthDate");
  const normalizedBirthDate = useMemo(
    () => normalizeBirthDateInput(birthDateRaw ?? ""),
    [birthDateRaw],
  );

  useEffect(() => {
    if (!birthDateRaw) return;
    const normalized = normalizeBirthDateInput(birthDateRaw);
    if (normalized && normalized !== birthDateRaw) {
      registerForm.setValue("birthDate", normalized, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [birthDateRaw, registerForm]);

  const computedAge = useMemo(
    () => calculateAge(normalizedBirthDate),
    [normalizedBirthDate],
  );
  const isBirthDateFuture = useMemo(() => {
    if (!normalizedBirthDate) return false;
    const dob = new Date(normalizedBirthDate);
    if (Number.isNaN(dob.getTime())) return false;
    return dob.getTime() > Date.now();
  }, [normalizedBirthDate]);

  useEffect(() => {
    if (!normalizedBirthDate) {
      registerForm.clearErrors("birthDate");
      return;
    }
    if (isBirthDateFuture) {
      registerForm.setError("birthDate", {
        type: "manual",
        message: "未来の日付は選択できません。",
      });
    } else {
      registerForm.clearErrors("birthDate");
    }
  }, [normalizedBirthDate, isBirthDateFuture, registerForm]);

  const handleLoginSubmit = loginForm.handleSubmit((values) => {
    const result = login(values);

    if (!result.success) {
      toast({
        title: "ログインに失敗しました",
        description: result.error,
        status: "error",
      });
      return;
    }

    toast({
      title: "ログインに成功しました",
      description: `${result.user.name}さん、ようこそ！`,
      status: "success",
    });
    router.push(`/dashboard/${result.user.role}`);
  });

  const handleNextStep = async () => {
    if (registerStep === 3) return;
    const currentRole = (registerForm.getValues("role") as UserRole) ?? "worker";
    const fieldsToValidate = getStepFields(registerStep, currentRole);
    registerForm.clearErrors(fieldsToValidate);
    const stepSchema = getStepSchema(registerStep, currentRole);
    const values = registerForm.getValues();
    const validationResult = stepSchema.safeParse(values);
    if (!validationResult.success) {
      validationResult.error.issues.forEach((issue) => {
        const [fieldPath] = issue.path;
        if (typeof fieldPath === "string") {
          registerForm.setError(fieldPath as FieldPath<RegisterFormValues>, {
            type: "manual",
            message: issue.message,
          });
        }
      });
      const firstInvalidField = validationResult.error.issues[0]?.path[0];
      if (typeof firstInvalidField === "string") {
        registerForm.setFocus(firstInvalidField as FieldPath<RegisterFormValues>);
      }
      return;
    }
    if (registerStep === 1 && normalizedBirthDate) {
      const age = calculateAge(normalizedBirthDate);
      if (isBirthDateFuture || age < 16 || age > 80) {
        registerForm.setError("birthDate", {
          type: "manual",
          message: "16歳以上80歳以下の生年月日を選択してください。",
        });
        return;
      }
    }
    setRegisterStep((prev) => (prev === 1 ? 2 : 3));
  };

  const handlePrevStep = () => {
    setRegisterStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleRegisterAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAvatarUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      registerForm.setValue("avatarUrl", dataUrl, {
        shouldDirty: true,
        shouldTouch: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "画像の読み込みに失敗しました",
        description: "別の画像でお試しください。",
        status: "error",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRegisterAvatarReset = () => {
    registerForm.setValue("avatarUrl", "", {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleCompleteRegistration = registerForm.handleSubmit((values) => {
    const age = calculateAge(values.birthDate);
    if (age < 16 || age > 80) {
      setRegisterStep(1);
      registerForm.setError("birthDate", {
        message: "16歳以上80歳以下が対象です。",
        type: "manual",
      });
      return;
    }

    if (!kycFileName) {
      toast({
        title: "本人確認書類を選択してください",
        description: "モックでも構いません。ファイル名のみ取得します。",
        status: "warning",
      });
      return;
    }

    const result = register({
      ...values,
      avatarUrl: values.avatarUrl ?? "",
      catchphrase: values.catchphrase ?? "",
      age,
      birthDate: values.birthDate,
    });

    if (!result.success) {
      toast({
        title: "会員登録に失敗しました",
        description: result.error,
        status: "error",
      });
      return;
    }

    submitKycRequest(result.user.id);

    toast({
      title: "会員登録が完了しました",
      description: `本人確認書類（${kycFileName}）を受け付け、審査中としました。`,
      status: "success",
    });

    router.push(`/dashboard/${result.user.role}`);
  });

  const handleMockSocialLogin = (
    role: UserRole,
    options?: { userId?: string },
  ): boolean => {
    const result = loginWithProvider(role, options);

    if (!result.success) {
      toast({
        title: "モックログイン失敗",
        description: result.error,
        status: "error",
      });
      return false;
    }

    toast({
      title: `${result.user.name}でログインしました`,
      status: "info",
      duration: 1800,
      isClosable: true,
    });
    router.push(`/dashboard/${result.user.role}`);
    return true;
  };

  return (
    <Center minH="100vh" px={4}>
      <Stack
        spacing={8}
        maxW="lg"
        w="full"
        bg="white"
        borderRadius="2xl"
        boxShadow="xl"
        p={{ base: 6, md: 10 }}
      >
        <Stack spacing={3} textAlign="center">
          <Heading size="lg">農家 × 学生マッチング</Heading>
          <Text color="gray.600" fontSize="sm">
            1つのログイン画面から労働者・農家・管理者の各UIを体験できます。
          </Text>
        </Stack>

        <Stack spacing={4}>
          <Text fontWeight="medium" color="gray.700" textAlign="center">
            ソーシャルログイン（モック）
          </Text>
          <Stack spacing={3}>
            <Button
              variant="outline"
              leftIcon={<FcGoogle size={20} />}
              onClick={() => handleMockSocialLogin("worker")}
            >
              Googleで体験ログイン(労働者)
            </Button>
            <Button
              variant="outline"
              leftIcon={<SiApple size={18} />}
              onClick={() => {
                if (farmerAccounts.length === 0) {
                  toast({
                    title: "モックアカウントが見つかりません",
                    description: "農家アカウントを追加してから再度お試しください。",
                    status: "error",
                  });
                  return;
                }
                setSelectedFarmerId(farmerAccounts[0]?.id ?? null);
                setFarmerSelectOpen(true);
              }}
            >
              Appleで体験ログイン(農家)
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Tabs variant="enclosed" colorScheme="blue" isFitted>
          <TabList>
            <Tab>ログイン</Tab>
            <Tab>会員登録</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <form onSubmit={handleLoginSubmit}>
                <Stack spacing={4}>
                  <FormControl isInvalid={Boolean(loginForm.formState.errors.email)}>
                    <FormLabel>メールアドレス</FormLabel>
                    <Input
                      type="text"
                      placeholder="example@example.com"
                      {...loginForm.register("email")}
                    />
                    {renderFieldError(loginForm.formState.errors.email?.message)}
                  </FormControl>
                  <FormControl
                    isInvalid={Boolean(loginForm.formState.errors.password)}
                  >
                    <FormLabel>パスワード</FormLabel>
                    <Input type="password" {...loginForm.register("password")} />
                    {renderFieldError(loginForm.formState.errors.password?.message)}
                  </FormControl>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loginForm.formState.isSubmitting}
                  >
                    ログイン
                  </Button>
                </Stack>
              </form>
            </TabPanel>
            <TabPanel px={0}>
              <form onSubmit={handleCompleteRegistration}>
                <Stack spacing={6}>
                  <Stack spacing={1}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.600">
                      ステップ {registerStep} / 3
                    </Text>
                    <Heading size="md">
                      {registerStep === 1
                        ? "プロフィール情報"
                        : registerStep === 2
                          ? "体験内容のカスタマイズ"
                          : "本人確認（モック）"}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {registerStep === 1
                        ? "氏名や生年月日などの基本情報を入力してください。"
                        : registerStep === 2
                          ? "体験したいロールや興味のある働き方を選択すると、今後の提案に活用できます。"
                          : "最後に本人確認書類をモックで提出し、登録を完了します。"}
                    </Text>
                  </Stack>

                  {registerStep === 1 && (
                    <Stack spacing={4}>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.name)}
                      >
                        <FormLabel>氏名</FormLabel>
                        <Input placeholder="山田 花子" {...registerForm.register("name")} />
                        {renderFieldError(registerForm.formState.errors.name?.message)}
                      </FormControl>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.email)}
                      >
                        <FormLabel>メールアドレス</FormLabel>
                        <Input
                          type="email"
                          placeholder="example@example.com"
                          {...registerForm.register("email")}
                        />
                        {renderFieldError(registerForm.formState.errors.email?.message)}
                      </FormControl>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.password)}
                      >
                        <FormLabel>パスワード</FormLabel>
                        <Input type="password" {...registerForm.register("password")} />
                        {renderFieldError(registerForm.formState.errors.password?.message)}
                      </FormControl>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.gender)}
                      >
                        <FormLabel>性別</FormLabel>
                        <Select {...registerForm.register("gender")}>
                          {GENDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        {renderFieldError(registerForm.formState.errors.gender?.message)}
                      </FormControl>
                      <HStack spacing={4} align="flex-start">
                        <FormControl
                          isInvalid={Boolean(registerForm.formState.errors.birthDate)}
                        >
                          <FormLabel>生年月日</FormLabel>
                          <Input type="date" {...registerForm.register("birthDate")} />
                          {renderFieldError(registerForm.formState.errors.birthDate?.message)}
                        </FormControl>
                        <FormControl>
                          <FormLabel>自動計算された年齢</FormLabel>
                          <Input
                            value={
                              normalizedBirthDate && !Number.isNaN(computedAge) && computedAge > 0
                                ? `${computedAge}`
                                : ""
                            }
                            isReadOnly
                            bg={
                              normalizedBirthDate
                                ? isBirthDateFuture
                                  ? "red.50"
                                  : "white"
                                : "gray.100"
                            }
                            color={isBirthDateFuture ? "red.600" : "gray.700"}
                            cursor="not-allowed"
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            生年月日を入力すると自動で年齢が算出されます。
                          </Text>
                        </FormControl>
                      </HStack>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.occupation)}
                      >
                        <FormLabel>職業</FormLabel>
                        <Select placeholder="職業を選択" {...registerForm.register("occupation")}>
                          {OCCUPATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      {renderFieldError(registerForm.formState.errors.occupation?.message)}
                      </FormControl>
                      <FormControl
                        isInvalid={Boolean(registerForm.formState.errors.location)}
                      >
                        <FormLabel>働きたい地域</FormLabel>
                        <Select placeholder="地域を選択" {...registerForm.register("location")}>
                          {LOCATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                    {renderFieldError(registerForm.formState.errors.location?.message)}
                      </FormControl>
                    </Stack>
                  )}

                  {registerStep === 2 && (
                    <Stack spacing={5}>
                      <FormControl isInvalid={Boolean(registerForm.formState.errors.role)}>
                        <FormLabel>体験したいロール</FormLabel>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {EXPERIENCE_ROLE_OPTIONS.map((option) => {
                            const isActive = selectedRole === option.value;
                            return (
                              <Box
                                key={option.value}
                                borderWidth="2px"
                                borderColor={isActive ? "blue.500" : "gray.200"}
                                bg={isActive ? "blue.50" : "white"}
                                borderRadius="lg"
                                p={4}
                                cursor="pointer"
                                onClick={() => {
                                  registerForm.setValue("role", option.value as UserRole, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  });
                                  registerForm.clearErrors("role");
                                }}
                                transition="all 0.2s ease"
                              >
                                <Text fontWeight="semibold" mb={1}>
                                  {option.label}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {option.description}
                                </Text>
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                        {renderFieldError(registerForm.formState.errors.role?.message)}
                      </FormControl>

                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>プロフィールアイコン</FormLabel>
                          <HStack align="center" spacing={4} flexWrap="wrap">
                            <Avatar
                              size="lg"
                              name={registerForm.watch("name")}
                              src={avatarPreview || undefined}
                            />
                            <Stack spacing={2} flex="1" minW={{ base: "100%", md: "240px" }}>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleRegisterAvatarChange}
                              />
                              <HStack spacing={2}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={handleRegisterAvatarReset}
                                >
                                  初期アイコンに戻す
                                </Button>
                                {isAvatarUploading ? <Spinner size="xs" /> : null}
                              </HStack>
                              <FormHelperText fontSize="xs">
                                画像をアップロードするとプロフィールやおすすめ募集で表示されます。
                              </FormHelperText>
                            </Stack>
                          </HStack>
                        </FormControl>
                        <FormControl>
                          <FormLabel>自己紹介の一言</FormLabel>
                          <Input
                            maxLength={60}
                            placeholder="例：農業体験で地域に貢献したいです"
                            {...registerForm.register("catchphrase")}
                          />
                          <FormHelperText fontSize="xs">
                            60文字以内で入力してください。プロフィールやおすすめ募集に表示されます。
                          </FormHelperText>
                        </FormControl>
                      </Stack>

                      {selectedRole === "farmer" ? (
                        <Stack spacing={5}>
                          <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerPostalCode)}>
                            <FormLabel>農地の郵便番号</FormLabel>
                            <Input
                              name={postalCodeField.name}
                              value={farmerPostalCode}
                              onBlur={postalCodeField.onBlur}
                              ref={postalCodeField.ref}
                              onChange={(event) => {
                                const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 7);
                                registerForm.setValue("farmerPostalCode", digitsOnly, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                });
                              }}
                              placeholder="例: 1000001"
                              inputMode="numeric"
                              maxLength={7}
                            />
                            <FormHelperText>ハイフンなし7桁で入力すると住所を自動補完します。</FormHelperText>
                            {isFetchingAddress ? (
                              <HStack spacing={2} mt={2}>
                                <Spinner size="xs" />
                                <Text fontSize="xs" color="gray.500">
                                  住所を検索しています...
                                </Text>
                              </HStack>
                            ) : null}
                            {postalCodeError ? (
                              <Text fontSize="xs" color="red.500" mt={1}>
                                {postalCodeError}
                              </Text>
                            ) : null}
                            {renderFieldError(registerForm.formState.errors.farmerPostalCode?.message)}
                          </FormControl>

                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerPrefecture)}>
                              <FormLabel>都道府県</FormLabel>
                              <Input
                                placeholder="例: 東京都"
                                {...registerForm.register("farmerPrefecture")}
                              />
                              {renderFieldError(registerForm.formState.errors.farmerPrefecture?.message)}
                            </FormControl>
                            <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerCity)}>
                              <FormLabel>市区町村</FormLabel>
                              <Input
                                placeholder="例: 千代田区大手町"
                                {...registerForm.register("farmerCity")}
                              />
                              {renderFieldError(registerForm.formState.errors.farmerCity?.message)}
                            </FormControl>
                            <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerAddressLine1)}>
                              <FormLabel>丁目・番地</FormLabel>
                              <Input
                                placeholder="例: 1-1-1"
                                {...registerForm.register("farmerAddressLine1")}
                              />
                              {renderFieldError(registerForm.formState.errors.farmerAddressLine1?.message)}
                            </FormControl>
                          </SimpleGrid>

                          <FormControl>
                            <FormLabel>建物名・部屋番号（任意）</FormLabel>
                            <Input
                              placeholder="任意で入力してください"
                              {...registerForm.register("farmerAddressLine2")}
                            />
                          </FormControl>

                          <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerFarmTypes)}>
                            <FormLabel>担当している（募集したい）農業の種類</FormLabel>
                            <Controller
                              control={registerForm.control}
                              name="farmerFarmTypes"
                              render={({ field }) => (
                                <CheckboxGroup
                                  value={field.value}
                                  onChange={(values) => field.onChange(values as string[])}
                                >
                                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                    {FARMER_FARM_TYPE_OPTIONS.map((option) => (
                                      <Checkbox key={option.value} value={option.value}>
                                        {option.label}
                                      </Checkbox>
                                    ))}
                                  </SimpleGrid>
                                </CheckboxGroup>
                              )}
                            />
                            <FormHelperText>複数選択できます。</FormHelperText>
                            {renderFieldError(registerForm.formState.errors.farmerFarmTypes?.message)}
                          </FormControl>

                          <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerBusySeasons)}>
                            <FormLabel>ピークになる時期</FormLabel>
                            <Controller
                              control={registerForm.control}
                              name="farmerBusySeasons"
                              render={({ field }) => (
                                <CheckboxGroup
                                  value={field.value}
                                  onChange={(values) => field.onChange(values as string[])}
                                >
                                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                    {FARMER_BUSY_SEASON_OPTIONS.map((option) => (
                                      <Checkbox key={option.value} value={option.value}>
                                        {option.label}
                                      </Checkbox>
                                    ))}
                                  </SimpleGrid>
                                </CheckboxGroup>
                              )}
                            />
                            <FormHelperText>複数選択できます。</FormHelperText>
                            {renderFieldError(registerForm.formState.errors.farmerBusySeasons?.message)}
                          </FormControl>

                          <FormControl isInvalid={Boolean(registerForm.formState.errors.farmerRecruitmentSize)}>
                            <FormLabel>募集人数の目安</FormLabel>
                            <Controller
                              control={registerForm.control}
                              name="farmerRecruitmentSize"
                              render={({ field }) => (
                                <RadioGroup
                                  value={field.value}
                                  onChange={(value) => field.onChange(value)}
                                >
                                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                    {FARMER_RECRUITMENT_SIZE_OPTIONS.map((option) => (
                                      <Radio key={option.value} value={option.value}>
                                        {option.label}
                                      </Radio>
                                    ))}
                                  </SimpleGrid>
                                </RadioGroup>
                              )}
                            />
                            {renderFieldError(registerForm.formState.errors.farmerRecruitmentSize?.message)}
                          </FormControl>
                        </Stack>
                      ) : (
                        <FormControl isInvalid={Boolean(registerForm.formState.errors.interests)}>
                          <FormLabel>気になるテーマ（任意）</FormLabel>
                          <Controller
                            control={registerForm.control}
                            name="interests"
                            render={({ field }) => {
                              const currentValues = (field.value ?? []) as string[];
                              const handleChange = (values: (string | number)[]) => {
                                field.onChange(values as string[]);
                                registerForm.clearErrors("interests");
                              };
                              return (
                                <Stack spacing={6}>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                                      気になる農業ジャンル
                                    </Text>
                                    <CheckboxGroup value={currentValues} onChange={handleChange}>
                                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                        {farmingOptionsToDisplay.map((option) => (
                                          <Checkbox key={option.value} value={option.value}>
                                            {option.label}
                                          </Checkbox>
                                        ))}
                                      </SimpleGrid>
                                    </CheckboxGroup>
                                    <Button
                                      type="button"
                                      variant="link"
                                      colorScheme="blue"
                                      mt={1}
                                      onClick={() => setShowAllFarmingTags((prev) => !prev)}
                                    >
                                      {showAllFarmingTags ? "おすすめだけ表示する" : "もっとタグを見る"}
                                    </Button>
                                  </Box>

                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                                      理想の働き方
                                    </Text>
                                    <CheckboxGroup value={currentValues} onChange={handleChange}>
                                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                        {workstyleOptionsToDisplay.map((option) => (
                                          <Checkbox key={option.value} value={option.value}>
                                            {option.label}
                                          </Checkbox>
                                        ))}
                                      </SimpleGrid>
                                    </CheckboxGroup>
                                    <Button
                                      type="button"
                                      variant="link"
                                      colorScheme="blue"
                                      mt={1}
                                      onClick={() => setShowAllWorkstyleTags((prev) => !prev)}
                                    >
                                      {showAllWorkstyleTags ? "おすすめだけ表示する" : "もっとタグを見る"}
                                    </Button>
                                  </Box>
                                </Stack>
                              );
                            }}
                          />
                          <FormHelperText>
                            興味を選ぶとレコメンドが強化されます。後からダッシュボードで変更できます。
                          </FormHelperText>
                        </FormControl>
                      )}
                    </Stack>
                  )}

                  {registerStep === 3 && (
                    <Stack spacing={4}>
                      <Stack spacing={3}>
                        <HStack spacing={3} align="center">
                          <Avatar
                            size="lg"
                            name={registerForm.watch("name")}
                            src={avatarPreview || undefined}
                          />
                          <Stack spacing={0}>
                            <Text fontWeight="semibold">{registerForm.watch("name")}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {registerForm.watch("email")}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {registerForm.watch("location")}
                            </Text>
                          </Stack>
                        </HStack>
                        {registerCatchphrase ? (
                          <Box bg="gray.50" borderRadius="lg" p={3}>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              一言メッセージ
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {registerCatchphrase}
                            </Text>
                          </Box>
                        ) : null}
                      </Stack>
                      <Text color="gray.600" fontSize="sm">
                        登録内容を確認し、本人確認書類をモックで提出してください。実際のファイルは保存されません。
                      </Text>
                      <FormControl>
                        <FormLabel>本人確認書類（モック）</FormLabel>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            setKycFileName(file ? file.name : null);
                          }}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          例: 運転免許証・学生証・パスポートなど。ファイル名のみ記録されます。
                        </Text>
                        {kycFileName ? (
                          <Text fontSize="sm" color="gray.600" mt={2}>
                            選択済み: {kycFileName}
                          </Text>
                        ) : null}
                      </FormControl>
                      <Alert status="info" borderRadius="lg">
                        <AlertIcon />
                        <Box>
                          <AlertTitle fontSize="sm">モック提出について</AlertTitle>
                          <AlertDescription fontSize="sm">
                            提出後は管理者ダッシュボードでステータスを変更し、承認・差戻し体験ができます。
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </Stack>
                  )}

                  <HStack justify="space-between">
                    {registerStep > 1 ? (
                      <Button variant="outline" onClick={handlePrevStep}>
                        戻る
                      </Button>
                    ) : (
                      <Box />
                    )}
                    {registerStep < 3 ? (
                      <Button colorScheme="blue" onClick={handleNextStep}>
                        次へ進む
                      </Button>
                    ) : (
                      <Button
                        colorScheme="blue"
                        type="submit"
                        isLoading={registerForm.formState.isSubmitting}
                      >
                        会員登録を完了する
                      </Button>
                    )}
                  </HStack>
                </Stack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Modal isOpen={isFarmerSelectOpen} onClose={() => setFarmerSelectOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>農家アカウントを選択</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <RadioGroup
                value={selectedFarmerId ?? ""}
                onChange={(value) => setSelectedFarmerId(value)}
              >
                <Stack spacing={3}>
                  {farmerAccounts.map((account) => (
                    <Radio key={account.id} value={account.id}>
                      <Stack spacing={0}>
                        <Text fontWeight="semibold">{account.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {account.email}・{account.location}
                        </Text>
                      </Stack>
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setFarmerSelectOpen(false)}>
                キャンセル
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  if (selectedFarmerId) {
                    const success = handleMockSocialLogin("farmer", {
                      userId: selectedFarmerId,
                    });
                    if (success) {
                      setFarmerSelectOpen(false);
                    }
                  }
                }}
                isDisabled={!selectedFarmerId}
              >
                ログインする
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Center>
  );
}
