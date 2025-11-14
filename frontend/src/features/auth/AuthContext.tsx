"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthResult,
  KycStatus,
  LoginPayload,
  RegisterPayload,
  UserProfile,
} from "./types";
import { userApi } from "./api/users";

type AuthContextValue = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  login: (payload: LoginPayload) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  loginWithProvider: (
    role: UserProfile["role"],
    options?: { userId?: string },
  ) => AuthResult;
  logout: () => void;
  submitKycRequest: (userId: string) => void;
  updateKycStatus: (userId: string, status: KycStatus) => void;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
};

const calcAgeFromBirthDate = (birthDate: string): number => {
  const today = new Date();
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) {
    return 0;
  }
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(age, 0);
};

const ensureAvatarUrl = (name: string, avatarUrl?: string): string => {
  if (avatarUrl && avatarUrl.trim().length > 0) return avatarUrl;
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
};

const DEFAULT_USERS: UserProfile[] = [
  {
    id: "worker-001",
    email: "worker@example.com",
    password: "password123",
    name: "田中 太郎",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Tanaka",
    catchphrase: "農業×学生で地域を盛り上げたい！",
    location: "北海道 札幌市",
    gender: "male",
    birthDate: "2001-04-15",
    age: calcAgeFromBirthDate("2001-04-15"),
    interests: ["seasonal", "community"],
    occupation: "大学生",
    role: "worker",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 4800,
  },
  {
    id: "farmer-001",
    email: "farmer@example.com",
    password: "password123",
    name: "佐藤 農子",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=SatoFarm",
    catchphrase: "大葉とミニトマトの香りに包まれて暮らしています。",
    location: "長野県 松本市",
    gender: "female",
    birthDate: "1984-09-02",
    age: calcAgeFromBirthDate("1984-09-02"),
    interests: ["organic", "technology"],
    occupation: "農家",
    role: "farmer",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 15200,
  },
  {
    id: "farmer-002",
    email: "farmer-toyohashi@example.com",
    password: "password123",
    name: "豊橋 大地",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Atsushi",
    catchphrase: "豊橋の土と風で育った野菜を届けます。",
    location: "愛知県 豊橋市",
    gender: "male",
    birthDate: "1989-03-11",
    age: calcAgeFromBirthDate("1989-03-11"),
    interests: ["seasonal", "technology", "value_added"],
    occupation: "農家",
    role: "farmer",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 9800,
  },
  {
    id: "farmer-003",
    email: "farmer-atami@example.com",
    password: "password123",
    name: "渥美 海風",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Umikaze",
    catchphrase: "潮風と太陽が自慢の果樹園を運営中。",
    location: "愛知県 田原市",
    gender: "female",
    birthDate: "1990-07-24",
    age: calcAgeFromBirthDate("1990-07-24"),
    interests: ["orchard", "community", "seasonal"],
    occupation: "農家",
    role: "farmer",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 11200,
  },
  {
    id: "farmer-004",
    email: "farmer-livestock@example.com",
    password: "password123",
    name: "牧場 直樹",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Naoki",
    catchphrase: "酪農とテックの融合に挑戦しています。",
    location: "愛知県 新城市",
    gender: "male",
    birthDate: "1982-12-05",
    age: calcAgeFromBirthDate("1982-12-05"),
    interests: ["livestock", "technology", "career_change"],
    occupation: "農家",
    role: "farmer",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 14300,
  },
  {
    id: "farmer-005",
    email: "farmer-flower@example.com",
    password: "password123",
    name: "花園 彩",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Ayaka",
    catchphrase: "花卉と加工品で新しい価値を届けます。",
    location: "愛知県 豊橋市",
    gender: "female",
    birthDate: "1995-05-18",
    age: calcAgeFromBirthDate("1995-05-18"),
    interests: ["value_added", "education", "community"],
    occupation: "農家",
    role: "farmer",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 8700,
  },
  {
    id: "admin-001",
    email: "admin@example.com",
    password: "password123",
    name: "運営 管理者",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Admin",
    catchphrase: "円滑なマッチング運営をサポートします。",
    location: "東京都 千代田区",
    gender: "other",
    birthDate: "1992-01-20",
    age: calcAgeFromBirthDate("1992-01-20"),
    interests: ["education", "community"],
    occupation: "運営",
    role: "admin",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 0,
  },
  {
    id: "admin-002",
    email: "admin",
    password: "admin123",
    name: "運営 管理者（ショートカット）",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=ShortcutAdmin",
    catchphrase: "ダッシュボード確認用の特別アカウントです。",
    location: "東京都 千代田区",
    gender: "other",
    birthDate: "1990-01-01",
    age: calcAgeFromBirthDate("1990-01-01"),
    interests: ["education", "community"],
    occupation: "運営",
    role: "admin",
    kycStatus: "approved",
    createdAt: new Date().toISOString(),
    miles: 0,
  },
];

const buildUser = (payload: RegisterPayload): UserProfile => ({
  ...payload,
  age: calcAgeFromBirthDate(payload.birthDate),
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  kycStatus: "unsubmitted",
  avatarUrl: ensureAvatarUrl(payload.name, payload.avatarUrl),
  catchphrase: payload.catchphrase ?? "",
  miles: 0,
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useApiMode, setUseApiMode] = useState(false); // API連携モードの切り替え

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthResult> => {
      try {
        setIsLoading(true);
        if (useApiMode) {
          // API連携モード
          const result = await userApi.login(payload);
          if (result.success && result.user) {
            setCurrentUser(result.user);
            // ローカル状態も更新（後方互換性のため）
            setUsers((prev) => {
              const existing = prev.find((u) => u.id === result.user!.id);
              if (existing) {
                return prev.map((u) => (u.id === result.user!.id ? result.user! : u));
              }
              return [...prev, result.user!];
            });
          }
          setIsLoading(false);
          return result;
        } else {
          // モックモード（後方互換性）
          const user = users.find(
            (candidate) =>
              candidate.email.toLowerCase() === payload.email.toLowerCase() &&
              candidate.password === payload.password,
          );

          if (!user) {
            setIsLoading(false);
            return {
              success: false,
              error: "メールアドレスもしくはパスワードが正しくありません。",
            };
          }

          const normalized = {
            ...user,
            age: calcAgeFromBirthDate(user.birthDate),
          };
          setCurrentUser(normalized);
          setIsLoading(false);
          return {
            success: true,
            user: normalized,
          };
        }
      } catch (error: unknown) {
        setIsLoading(false);
        return {
          success: false,
          error: error instanceof Error ? error.message : "ログインに失敗しました",
        };
      }
    },
    [users, useApiMode],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthResult> => {
      try {
        setIsLoading(true);
        if (useApiMode) {
          // API連携モード
          const result = await userApi.register(payload);
          if (result.success && result.user) {
            setCurrentUser(result.user);
            // ローカル状態も更新（後方互換性のため）
            setUsers((prev) => [...prev, result.user!]);
          }
          setIsLoading(false);
          return result;
        } else {
          // モックモード（後方互換性）
          const exists = users.some(
            (candidate) =>
              candidate.email.toLowerCase() === payload.email.toLowerCase(),
          );

          if (exists) {
            setIsLoading(false);
            return {
              success: false,
              error: "このメールアドレスは既に登録されています。",
            };
          }

          const user = buildUser(payload);
          setUsers((prev) => [...prev, user]);
          setCurrentUser(user);
          setIsLoading(false);

          return {
            success: true,
            user,
          };
        }
      } catch (error: unknown) {
        setIsLoading(false);
        return {
          success: false,
          error: error instanceof Error ? error.message : "登録に失敗しました",
        };
      }
    },
    [users, useApiMode],
  );

  const loginWithProvider = useCallback(
    (role: UserProfile["role"], options?: { userId?: string }): AuthResult => {
      const candidates = users.filter((candidate) => candidate.role === role);

      if (candidates.length === 0) {
        return {
          success: false,
          error: "モックアカウントが見つかりませんでした。",
        };
      }

      const user =
        options?.userId != null
          ? candidates.find((candidate) => candidate.id === options.userId)
          : candidates[0];

      if (!user) {
        return {
          success: false,
          error: "指定したモックアカウントが見つかりませんでした。",
        };
      }

      const normalized = {
        ...user,
        age: calcAgeFromBirthDate(user.birthDate),
      };
      setCurrentUser(normalized);
      return {
        success: true,
        user: normalized,
      };
    },
    [users],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const submitKycRequest = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, kycStatus: "pending" } : user,
      ),
    );
    setCurrentUser((prev) =>
      prev && prev.id === userId ? { ...prev, kycStatus: "pending" } : prev,
    );
  }, []);

  const updateKycStatus = useCallback((userId: string, status: KycStatus) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, kycStatus: status } : user,
      ),
    );
    setCurrentUser((prev) =>
      prev && prev.id === userId ? { ...prev, kycStatus: status } : prev,
    );
  }, []);

  const applyProfileUpdates = useCallback(
    (user: UserProfile, updates: Partial<UserProfile>): UserProfile => {
      const next: UserProfile = {
        ...user,
        ...updates,
      };
      if (updates.birthDate) {
        next.age = calcAgeFromBirthDate(next.birthDate);
      }
      if (updates.avatarUrl !== undefined || updates.name) {
        next.avatarUrl = ensureAvatarUrl(next.name, updates.avatarUrl ?? next.avatarUrl);
      }
      if (updates.catchphrase === undefined && !next.catchphrase) {
        next.catchphrase = "";
      }
      return next;
    },
    [],
  );

  const updateProfile = useCallback(
    async (userId: string, updates: Partial<UserProfile>) => {
      try {
        if (useApiMode) {
          // API連携モード
          const updatedUser = await userApi.updateUser(userId, updates);
          if (updatedUser) {
            setCurrentUser(updatedUser);
            // ローカル状態も更新（後方互換性のため）
            setUsers((prev) =>
              prev.map((user) => (user.id === userId ? updatedUser : user)),
            );
          }
        } else {
          // モックモード（後方互換性）
          setUsers((prev) =>
            prev.map((user) => (user.id === userId ? applyProfileUpdates(user, updates) : user)),
          );
          setCurrentUser((prev) => {
            if (!prev || prev.id !== userId) return prev;
            return applyProfileUpdates(prev, updates);
          });
        }
      } catch (error) {
        console.error("プロフィール更新エラー:", error);
        // エラー時はモックモードで更新を試みる
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? applyProfileUpdates(user, updates) : user)),
        );
        setCurrentUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          return applyProfileUpdates(prev, updates);
        });
      }
    },
    [applyProfileUpdates, useApiMode],
  );

  // API連携モードの初期化（環境変数または設定で制御可能）
  useEffect(() => {
    const apiMode = localStorage.getItem("authApiMode") === "true";
    setUseApiMode(apiMode);
    
    // APIモードの場合、初期ユーザーリストを取得
    if (apiMode) {
      userApi.getUsers().then((apiUsers) => {
        if (apiUsers.length > 0) {
          setUsers(apiUsers);
        }
      }).catch((error) => {
        console.warn("APIからユーザー一覧を取得できませんでした。モックデータを使用します。", error);
      });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      users,
      login,
      register,
      loginWithProvider,
      logout,
      submitKycRequest,
      updateKycStatus,
      updateProfile,
      isLoading,
    }),
    [
      currentUser,
      users,
      login,
      register,
      loginWithProvider,
      logout,
      submitKycRequest,
      updateKycStatus,
      updateProfile,
      isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

