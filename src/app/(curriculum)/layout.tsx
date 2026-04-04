"use client";

/**
 * Curriculum Layout
 * Layout for curriculum pages with proper meta and providers
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface CurriculumLayoutProps {
  children: ReactNode;
}

export default function CurriculumLayout({ children }: CurriculumLayoutProps) {
  // Create a client for each session to avoid shared state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <div className="curriculum-layout">
        {children}
      </div>
    </QueryClientProvider>
  );
}
