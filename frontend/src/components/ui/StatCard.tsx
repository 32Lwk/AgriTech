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
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      p={{ base: 5, md: 6 }}
      borderWidth="1px"
      borderColor="white"
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        bg: "linear-gradient(90deg, agri.400 0%, agri.500 50%, agri.600 100%)",
      }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Text fontSize="sm" color="gray.600" fontWeight="600" letterSpacing="wide">
          {label}
        </Text>
        <Box
          color="agri.500"
          fontSize="xl"
          opacity={0.8}
          transform="scale(1.1)"
        >
          {icon}
        </Box>
      </Flex>
      <Flex align="baseline" gap={1}>
        <Heading
          size="lg"
          bgGradient="linear(to-r, agri.600, agri.500)"
          bgClip="text"
          fontWeight="800"
        >
          {value}
        </Heading>
        {unit ? (
          <Text fontSize="md" color="gray.500" fontWeight="600" ml={1}>
            {unit}
          </Text>
        ) : null}
      </Flex>
      {trend ? (
        <Text fontSize="xs" color="agri.600" mt={3} fontWeight="600">
          {trend}
        </Text>
      ) : null}
    </Box>
  );
}

