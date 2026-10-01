import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  fetchInvestorSettlements,
  fetchProjectInvestors,
  fetchSettlement,
  fetchSettlementProjectOptions,
  fetchSettlements,
  previewSettlement,
} from "./api";
import type { SettlementPayload } from "./types";

export const settlementsQuery = queryOptions({
  queryKey: ["admin", "settlements"],
  queryFn: fetchSettlements,
});

export const settlementDetailQuery = (settlementId: string) =>
  queryOptions({
    queryKey: ["admin", "settlements", "detail", settlementId],
    queryFn: () => fetchSettlement(settlementId),
  });

export const investorSettlementsQuery = queryOptions({
  queryKey: ["admin", "investor-settlements"],
  queryFn: fetchInvestorSettlements,
});

export const settlementProjectOptionsQuery = queryOptions({
  queryKey: ["admin", "settlements", "project-options"],
  queryFn: fetchSettlementProjectOptions,
});

export const projectInvestorsQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["admin", "settlements", "project-investors", projectId],
    queryFn: () => fetchProjectInvestors(projectId),
  });

const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Live preview settlement: debounce 400 ms lalu POST /preview.
 * Tiap payload menjadi query key tersendiri, jadi response yang sudah basi
 * otomatis diabaikan. `payload = null` berarti form belum valid (preview tidak dipanggil).
 */
export function useSettlementPreview(payload: SettlementPayload | null) {
  const key = payload ? JSON.stringify(payload) : null;
  const [debouncedKey, setDebouncedKey] = useState(key);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedKey(key), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [key]);

  const query = useQuery({
    queryKey: ["admin", "settlements", "preview", debouncedKey],
    queryFn: () => previewSettlement(JSON.parse(debouncedKey!)),
    enabled: debouncedKey !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 30_000,
  });

  const isReady = key !== null;
  const isUpToDate =
    isReady &&
    key === debouncedKey &&
    !query.isFetching &&
    !query.isPlaceholderData;

  return {
    isReady,
    /** Hasil preview terakhir (bisa sedikit tertinggal saat sedang menghitung ulang). */
    preview: isReady ? query.data : undefined,
    /** true bila preview sudah sesuai dengan isi form saat ini — syarat untuk menyimpan. */
    isUpToDate: isUpToDate && !query.isError && query.data !== undefined,
    isCalculating: isReady && !isUpToDate,
    error: isReady && key === debouncedKey ? query.error : null,
  };
}
