"use client";

import { MotiaClientProvider } from "@/components/MotiaClientProvider";
import { ClientProvider } from "@/components/ClientProvider";
import { TamboProvider } from "@tambo-ai/react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    console.error("[AppProviders] ❌ NEXT_PUBLIC_TAMBO_API_KEY not found");
  }

  // Removed MotiaClientProvider - WebSocket not needed for current implementation
  // All backend communication uses HTTP/REST APIs
  return (
    <TamboProvider apiKey={apiKey || ""}>
      <ClientProvider>{children}</ClientProvider>
    </TamboProvider>
  );
}
