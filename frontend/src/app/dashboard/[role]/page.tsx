import { notFound } from "next/navigation";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import type { SidebarNavItem } from "@/components/layout/SidebarNav";
import type { UserRole } from "@/features/auth/types";

const ROLE_CONFIG: Record<
  UserRole,
  { role: UserRole; title: string; subtitle: string; nav: SidebarNavItem[] }
> = {
  worker: {
    role: "worker",
    title: "労働者ダッシュボード",
    subtitle: "応募状況やマイルを確認できます",
    nav: [
      { label: "ホーム", href: "/dashboard/worker" },
      { label: "募集一覧", href: "/dashboard/worker/opportunities" },
      { label: "マイル", href: "/dashboard/worker/miles" },
    ],
  },
  farmer: {
    role: "farmer",
    title: "農家ダッシュボード",
    subtitle: "募集管理と応募者の確認を行います",
    nav: [
      { label: "ホーム", href: "/dashboard/farmer" },
      { label: "募集管理", href: "/dashboard/farmer/opportunities" },
      { label: "応募者リスト", href: "/dashboard/farmer/applicants" },
    ],
  },
  admin: {
    role: "admin",
    title: "管理者ダッシュボード",
    subtitle: "全体の運用状況と本人確認を管理します",
    nav: [
      { label: "ホーム", href: "/dashboard/admin" },
      { label: "利用状況", href: "/dashboard/admin/overview" },
      { label: "本人確認", href: "/dashboard/admin/kyc" },
    ],
  },
};

type DashboardPageProps = {
  params: {
    role: string;
  };
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const role = params.role as UserRole;
  const config = ROLE_CONFIG[role];
  if (!config) {
    notFound();
  }

  return <DashboardContainer config={config} />;
}

