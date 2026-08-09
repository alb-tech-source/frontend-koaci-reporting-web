import { useQuery } from "@tanstack/react-query";
import { fetchAllPermissions } from "@/features/settings/api";

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions", "all"],
    queryFn: fetchAllPermissions,
    staleTime: 5 * 60 * 1000,
  });
}