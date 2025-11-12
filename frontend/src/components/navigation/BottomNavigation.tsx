import { Badge, Button, Flex, Text, type FlexProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

type BottomNavigationItem = {
  key: string;
  label: string;
  icon: ReactNode;
  badgeCount?: number;
  badgeLabel?: string;
};

type BottomNavigationProps = {
  items: BottomNavigationItem[];
  activeKey: string;
  onChange: (key: string) => void;
  containerProps?: FlexProps;
};

export default function BottomNavigation({
  items,
  activeKey,
  onChange,
  containerProps,
}: BottomNavigationProps) {
  return (
    <Flex
      as="nav"
      role="navigation"
      aria-label="メインボトムナビゲーション"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex="modal"
      bg="white"
      borderTopWidth="1px"
      boxShadow="md"
      w="100%"
      maxW="100vw"
      px={2}
      py={2}
      pb="calc(0.75rem + env(safe-area-inset-bottom, 0px))"
      {...containerProps}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const hasBadge = (item.badgeCount ?? 0) > 0;

        return (
          <Button
            key={item.key}
            onClick={() => onChange(item.key)}
            flex="1"
            variant="ghost"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={3}
            borderRadius="0"
            colorScheme={isActive ? "blue" : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
            _active={{ bg: isActive ? "blue.100" : "gray.100" }}
            gap={1}
            fontSize="xs"
            fontWeight={isActive ? "bold" : "medium"}
          >
            <Flex position="relative" fontSize="lg" aria-hidden="true">
              {item.icon}
              {hasBadge ? (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top={-1}
                  right={-3}
                  fontSize="0.6rem"
                  px={1.5}
                  py={0.5}
                >
                  {item.badgeLabel ?? item.badgeCount}
                </Badge>
              ) : null}
            </Flex>
            <Text>{item.label}</Text>
          </Button>
        );
      })}
    </Flex>
  );
}

