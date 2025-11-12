"use client";

import { useMemo, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Avatar, Stack, Text } from "@chakra-ui/react";
import AppShell from "@/components/layout/AppShell";
import DashboardHeader from "@/components/layout/DashboardHeader";
import type { SidebarNavItem } from "@/components/layout/SidebarNav";
import { useAuth } from "@/features/auth/AuthContext";
import type { UserRole } from "@/features/auth/types";
import WorkerDashboard from "@/features/dashboard/worker/WorkerDashboard";
import FarmerDashboard from "@/features/dashboard/farmer/FarmerDashboard";
import AdminDashboard from "@/features/dashboard/admin/AdminDashboard";

type DashboardContainerProps = {
  config: {
    role: UserRole;
    title: string;
    subtitle: string;
    nav: SidebarNavItem[];
  };
};

export default function DashboardContainer({ config }: DashboardContainerProps) {
  const { currentUser } = useAuth();

  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === config.role;
  }, [config.role, currentUser]);

  if (!currentUser) {
    redirect("/login");
  }

  if (!isAuthorized) {
    redirect(`/dashboard/${currentUser.role}`);
  }

  let content: ReactNode = null;

  switch (config.role) {
    case "worker":
      content = <WorkerDashboard />;
      break;
    case "farmer":
      content = <FarmerDashboard />;
      break;
    case "admin":
      content = <AdminDashboard />;
      break;
    default:
      content = null;
  }

  const sidebar = null;

  const headerRightSlot =
    currentUser && config.role === "worker"
      ? (() => {
          const catchphrase =
            currentUser.catchphrase || "農業×学生で地域を盛り上げたい！";
          return (
            <>
              <Stack spacing={1} align="flex-end">
                {catchphrase ? (
                  <Text fontSize="sm" color="gray.500" maxW="240px" textAlign="right">
                    {catchphrase}
                  </Text>
                ) : null}
                <Stack spacing={0} textAlign="right">
                  <Text fontWeight="semibold">
                    {currentUser.name || "ワーカー"}
                  </Text>
                  {typeof currentUser.miles === "number" ? (
                    <Text fontSize="sm" color="gray.500">
                      {currentUser.miles.toLocaleString()} mile
                    </Text>
                  ) : null}
                </Stack>
              </Stack>
              <Avatar
                size="md"
                name={currentUser.name}
                src={currentUser.avatarUrl || undefined}
              />
            </>
          );
        })()
      : currentUser && config.role === "farmer"
        ? (() => {
            const catchphrase =
              currentUser.catchphrase || "地域と共に農業をアップデート";
            return (
              <>
                <Stack spacing={1} align="flex-end">
                  {catchphrase ? (
                    <Text fontSize="sm" color="gray.500" maxW="240px" textAlign="right">
                      {catchphrase}
                    </Text>
                  ) : null}
                  <Stack spacing={0} textAlign="right">
                    <Text fontWeight="semibold">
                      {currentUser.name || "ファーマー"}
                    </Text>
                    {typeof currentUser.miles === "number" ? (
                      <Text fontSize="sm" color="gray.500">
                        {currentUser.miles.toLocaleString()} mile
                      </Text>
                    ) : null}
                  </Stack>
                </Stack>
                <Avatar
                  size="md"
                  name={currentUser.name}
                  src={currentUser.avatarUrl || undefined}
                />
              </>
            );
          })()
        : undefined;

  return (
    <AppShell
      header={
        <DashboardHeader
          title={config.title}
          subtitle={config.subtitle}
          rightSlot={headerRightSlot}
        />
      }
      sidebar={sidebar}
    >
      {content}
    </AppShell>
  );
}

