import { Avatar, HStack, Heading, Stack, Tab, TabList, Tabs, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type DashboardTab = {
  key: string;
  label: string;
  icon?: ReactNode;
};

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  userName: string;
  userMiles?: number;
  avatarUrl?: string;
  catchphrase?: string;
  tabs?: DashboardTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAvatarClick?: () => void;
};

export function DashboardHeader({
  title,
  subtitle,
  userName,
  userMiles,
  avatarUrl,
  catchphrase,
  tabs = [],
  activeTab,
  onTabChange,
  onAvatarClick,
}: DashboardHeaderProps) {
  const hasTabs = tabs.length > 0 && activeTab != null && onTabChange;
  const activeIndex =
    hasTabs && activeTab
      ? Math.max(
          tabs.findIndex((tab) => tab.key === activeTab),
          0,
        )
      : 0;

  return (
    <Stack spacing={4} mb={4}>
      <HStack justify="space-between" align="center" spacing={4}>
        <Stack spacing={1}>
          <Heading size="md">{title}</Heading>
          {subtitle ? (
            <Text fontSize="sm" color="gray.600">
              {subtitle}
            </Text>
          ) : null}
          {catchphrase ? (
            <Text fontSize="sm" color="gray.500">
              {catchphrase}
            </Text>
          ) : null}
        </Stack>
        <HStack spacing={3} align="center">
          <Stack spacing={0} textAlign="right">
            <Text fontWeight="semibold">{userName}</Text>
            {userMiles != null ? (
              <Text fontSize="sm" color="gray.500">
                {userMiles.toLocaleString()} mile
              </Text>
            ) : null}
          </Stack>
          <Avatar
            size="md"
            name={userName}
            src={avatarUrl || undefined}
            cursor={onAvatarClick ? "pointer" : "default"}
            onClick={onAvatarClick}
          />
        </HStack>
      </HStack>
      {hasTabs ? (
        <Tabs
          index={activeIndex}
          variant="soft-rounded"
          colorScheme="green"
          onChange={(index) => {
            const tab = tabs[index];
            if (tab && onTabChange) {
              onTabChange(tab.key);
            }
          }}
        >
          <TabList overflowX="auto" pb={1}>
            {tabs.map((tab) => (
              <Tab key={tab.key} whiteSpace="nowrap" gap={2}>
                {tab.icon}
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      ) : null}
    </Stack>
  );
}

