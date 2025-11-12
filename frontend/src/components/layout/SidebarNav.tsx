"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Flex, Icon, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { IconType } from "react-icons";
import { FiCompass } from "react-icons/fi";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon?: IconType;
};

type SidebarNavProps = {
  items: SidebarNavItem[];
};

export default function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <Flex direction="column" p={4} gap={2}>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const IconComponent = item.icon ?? FiCompass;

        return (
          <LinkBox
            key={item.href}
            borderRadius="lg"
            bg={isActive ? "blue.50" : "transparent"}
            color={isActive ? "blue.600" : "gray.700"}
            _hover={{ bg: "blue.50", color: "blue.600" }}
            px={3}
            py={2.5}
            transition="background-color 0.2s ease"
          >
            <Flex align="center" gap={3}>
              <Icon as={IconComponent} boxSize={5} />
              <LinkOverlay as={NextLink} href={item.href}>
                <Text fontWeight="medium">{item.label}</Text>
              </LinkOverlay>
            </Flex>
          </LinkBox>
        );
      })}
    </Flex>
  );
}

