"use client";

import { Flex, Heading, HStack, Text } from "@chakra-ui/react";

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function DashboardHeader({
  title,
  subtitle,
  rightSlot,
}: DashboardHeaderProps) {
  return (
    <Flex
      px={{ base: 4, md: 6 }}
      py={{ base: 3, md: 4 }}
      align="center"
      justify="space-between"
      gap={4}
    >
      <Flex direction="column">
        <Heading size="md">{title}</Heading>
        {subtitle ? (
          <Text fontSize="sm" color="gray.600" mt={1}>
            {subtitle}
          </Text>
        ) : null}
      </Flex>
      {rightSlot ? <HStack spacing={3}>{rightSlot}</HStack> : null}
    </Flex>
  );
}

