import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  GENDER_OPTIONS,
  INTEREST_FARMING_OPTIONS,
  INTEREST_WORKSTYLE_OPTIONS,
  LOCATION_OPTIONS,
} from "@/constants/profile";
import type { GenderOption, UserRole } from "@/features/auth/types";
import { readFileAsDataUrl } from "@/utils/file";

export type ProfileEditorValue = {
  name: string;
  email: string;
  password: string;
  location: string;
  gender: GenderOption;
  birthDate: string;
  occupation: string;
  interests: string[];
  catchphrase: string;
  avatarUrl: string;
};

type ProfileEditorModalProps = {
  isOpen: boolean;
  title?: string;
  submitLabel?: string;
  initialValue: ProfileEditorValue;
  role: UserRole;
  onClose: () => void;
  onSubmit: (value: ProfileEditorValue) => void;
};

type ProfileEditorErrors = Partial<Record<keyof ProfileEditorValue, string>>;

const calculateAge = (birthDate: string): number => {
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

const locationLabelByRole: Record<UserRole, string> = {
  worker: "働きたい地域",
  farmer: "拠点（活動エリア）",
  admin: "拠点（活動エリア）",
};

export function ProfileEditorModal({
  isOpen,
  onClose,
  onSubmit,
  initialValue,
  title = "プロフィールを編集",
  submitLabel = "保存する",
  role,
}: ProfileEditorModalProps) {
  const [draft, setDraft] = useState<ProfileEditorValue>(initialValue);
  const [errors, setErrors] = useState<ProfileEditorErrors>({});
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(initialValue);
      setErrors({});
    }
  }, [initialValue, isOpen]);

  const locationLabel = locationLabelByRole[role] ?? "拠点";

  const farmingInterestValues = useMemo(
    () => INTEREST_FARMING_OPTIONS.map((option) => option.value),
    [],
  );

  const handleInputChange =
    (key: keyof ProfileEditorValue) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setDraft((prev) => ({
        ...prev,
        [key]: value,
      }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleSelectChange =
    (key: keyof ProfileEditorValue) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setDraft((prev) => ({
        ...prev,
        [key]: value,
      }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleGenderChange = (value: GenderOption) => {
    setDraft((prev) => ({ ...prev, gender: value }));
    setErrors((prev) => ({ ...prev, gender: undefined }));
  };

  const handleAvatarReset = () => {
    setDraft((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAvatarUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraft((prev) => ({
        ...prev,
        avatarUrl: dataUrl,
      }));
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        avatarUrl: "画像の読み込みに失敗しました。別のファイルでお試しください。",
      }));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const validate = (): boolean => {
    const nextErrors: ProfileEditorErrors = {};
    if (!draft.name.trim()) {
      nextErrors.name = "氏名を入力してください。";
    }
    if (!draft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      nextErrors.email = "有効なメールアドレスを入力してください。";
    }
    if (!draft.password || draft.password.length < 6) {
      nextErrors.password = "パスワードは6文字以上で入力してください。";
    }
    if (!draft.location.trim()) {
      nextErrors.location = `${locationLabel}を選択してください。`;
    }
    if (!draft.birthDate) {
      nextErrors.birthDate = "生年月日を入力してください。";
    } else {
      const age = calculateAge(draft.birthDate);
      if (age < 16 || age > 80) {
        nextErrors.birthDate = "16歳以上80歳以下の生年月日を入力してください。";
      }
    }
    if (!draft.occupation.trim()) {
      nextErrors.occupation = "職業を入力してください。";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(draft);
  };

  const farmingInterests = draft.interests.filter((value) =>
    farmingInterestValues.includes(value),
  );
  const workstyleInterests = draft.interests.filter(
    (value) => !farmingInterestValues.includes(value),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={5}>
            <FormControl isInvalid={Boolean(errors.avatarUrl)}>
              <FormLabel>プロフィールアイコン</FormLabel>
              <HStack align="center" spacing={4} flexWrap="wrap">
                <Avatar size="xl" name={draft.name} src={draft.avatarUrl || undefined} />
                <Stack spacing={2} flex="1" minW={{ base: "100%", md: "220px" }}>
                  <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                  <HStack spacing={2}>
                    <Button size="xs" variant="outline" onClick={handleAvatarReset}>
                      初期アイコンに戻す
                    </Button>
                    {isAvatarUploading ? <Spinner size="xs" /> : null}
                  </HStack>
                  <FormHelperText fontSize="xs">
                    画像をアップロードするとプロフィールやおすすめ募集に反映されます。
                  </FormHelperText>
                </Stack>
              </HStack>
              {errors.avatarUrl ? (
                <FormErrorMessage>{errors.avatarUrl}</FormErrorMessage>
              ) : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.name)}>
              <FormLabel>氏名</FormLabel>
              <Input value={draft.name} onChange={handleInputChange("name")} placeholder="例：山田 太郎" />
              {errors.name ? <FormErrorMessage>{errors.name}</FormErrorMessage> : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.email)}>
              <FormLabel>メールアドレス</FormLabel>
              <Input
                type="email"
                value={draft.email}
                onChange={handleInputChange("email")}
                placeholder="example@example.com"
              />
              {errors.email ? <FormErrorMessage>{errors.email}</FormErrorMessage> : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.password)}>
              <FormLabel>パスワード</FormLabel>
              <Input
                type="password"
                value={draft.password}
                onChange={handleInputChange("password")}
                placeholder="6文字以上で入力してください"
              />
              {errors.password ? <FormErrorMessage>{errors.password}</FormErrorMessage> : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.gender)}>
              <FormLabel>性別</FormLabel>
              <RadioGroup
                value={draft.gender}
                onChange={(value) => handleGenderChange(value as GenderOption)}
              >
                <HStack spacing={4} wrap="wrap">
                  {GENDER_OPTIONS.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.birthDate)}>
              <FormLabel>生年月日</FormLabel>
              <Input
                type="date"
                value={draft.birthDate}
                onChange={handleInputChange("birthDate")}
              />
              <FormHelperText fontSize="xs">
                生年月日から年齢を自動計算します（16〜80歳が対象）。
              </FormHelperText>
              {errors.birthDate ? <FormErrorMessage>{errors.birthDate}</FormErrorMessage> : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.occupation)}>
              <FormLabel>職業</FormLabel>
              <Input
                value={draft.occupation}
                onChange={handleInputChange("occupation")}
                placeholder="例：大学生・会社員など"
              />
              {errors.occupation ? (
                <FormErrorMessage>{errors.occupation}</FormErrorMessage>
              ) : null}
            </FormControl>

            <FormControl isInvalid={Boolean(errors.location)}>
              <FormLabel>{locationLabel}</FormLabel>
              <Select
                placeholder={`${locationLabel}を選択`}
                value={draft.location}
                onChange={handleSelectChange("location")}
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              {errors.location ? <FormErrorMessage>{errors.location}</FormErrorMessage> : null}
            </FormControl>

            <FormControl>
              <FormLabel>気になる農業ジャンル</FormLabel>
              <CheckboxGroup
                value={farmingInterests}
                onChange={(values) => {
                  const merged = Array.from(
                    new Set([
                      ...(values as string[]),
                      ...workstyleInterests,
                    ]),
                  );
                  setDraft((prev) => ({ ...prev, interests: merged }));
                }}
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {INTEREST_FARMING_OPTIONS.map((option) => (
                    <Checkbox key={option.value} value={option.value}>
                      {option.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
              <FormHelperText fontSize="xs">
                選択した内容はおすすめ案件に反映されます。
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>理想の働き方タグ</FormLabel>
              <CheckboxGroup
                value={workstyleInterests}
                onChange={(values) => {
                  const merged = Array.from(
                    new Set([
                      ...farmingInterests,
                      ...(values as string[]),
                    ]),
                  );
                  setDraft((prev) => ({ ...prev, interests: merged }));
                }}
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {INTEREST_WORKSTYLE_OPTIONS.map((option) => (
                    <Checkbox key={option.value} value={option.value}>
                      {option.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </FormControl>

            <FormControl>
              <FormLabel>自己紹介の一言</FormLabel>
              <Textarea
                value={draft.catchphrase}
                onChange={handleInputChange("catchphrase")}
                placeholder="例：地域の農業でスキルを磨きたい大学生です。"
                maxLength={60}
              />
              <FormHelperText fontSize="xs">60文字以内で入力してください。</FormHelperText>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button colorScheme="blue" type="submit">
              {submitLabel}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

