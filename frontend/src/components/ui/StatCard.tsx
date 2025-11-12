"use client";

import { ReactNode } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";

type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  icon?: ReactNode;
};

export default function StatCard({
  label,
  value,
  unit,
  trend,
  icon,
}: StatCardProps) {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="sm"
      p={{ base: 4, md: 5 }}
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          {label}
        </Text>
        {icon}
      </Flex>
      <Flex align="baseline" gap={1}>
        <Heading size="lg">{value}</Heading>
        {unit ? (
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {unit}
          </Text>
        ) : null}
      </Flex>
      {trend ? (
        <Text fontSize="xs" color="blue.500" mt={2}>
          {trend}
        </Text>
      ) : null}
    </Box>
  );
}

