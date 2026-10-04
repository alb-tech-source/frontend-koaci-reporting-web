"use client";

import { PageSkeleton } from "@/shared/components/ui/feedback";

// Fallback Suspense untuk halaman admin yang memakai useSuspenseQuery
export default function AdminLoading() {
  return <PageSkeleton />;
}
