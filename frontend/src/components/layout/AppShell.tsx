"use client";

import { ReactNode } from "react";
import { Box, Flex } from "@chakra-ui/react";

type AppShellProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ header, sidebar, children }: AppShellProps) {
  return (
    <Flex minH="100vh" direction="column">
      {header && (
        <Box as="header" borderBottomWidth="1px" bg="white">
          {header}
        </Box>
      )}
      <Flex flex="1" overflow="hidden">
        {sidebar && (
          <Box
            as="nav"
            display={{ base: "none", lg: "block" }}
            w="72"
            borderRightWidth="1px"
            bg="white"
            overflowY="auto"
          >
            {sidebar}
          </Box>
        )}
        <Box flex="1" overflowY="auto" bg="gray.50" p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

