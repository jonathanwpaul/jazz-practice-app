"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";

const DbProvider = dynamic(
  () => import("@/lib/db-provider").then((m) => m.DbProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 30 } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DbProvider>{children}</DbProvider>
    </QueryClientProvider>
  );
}
