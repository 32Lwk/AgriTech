"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "@/theme";
import { AuthProvider } from "@/features/auth/AuthContext";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AuthProvider>{children}</AuthProvider>
    </ChakraProvider>
  );
}

