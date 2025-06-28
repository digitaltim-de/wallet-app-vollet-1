"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { WalletAddressModalProvider } from "./WalletAddressModalProvider";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WalletAddressModalProvider>
          {children}
          <Toaster />
        </WalletAddressModalProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
