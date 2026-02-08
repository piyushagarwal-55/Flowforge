"use client";

import { MotiaStreamProvider } from "@motiadev/stream-client-react";

export function MotiaClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^http/, 'ws') || 'ws://localhost:3000';
  return (
    <MotiaStreamProvider address={wsUrl}>
      {children}
    </MotiaStreamProvider>
  );
}
