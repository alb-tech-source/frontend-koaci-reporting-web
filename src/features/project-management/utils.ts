import type { ProjectStatus } from "./types";

export const projectStatusBadgeClass: Record<ProjectStatus, string> = {
  open: "border-transparent bg-brand/10 text-brand",
  closed: "border-transparent bg-muted text-muted-foreground",
  target_achieved: "border-transparent bg-success/15 text-success",
  cancelled: "border-transparent bg-danger/15 text-danger",
};

export function fundingProgress(collected: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.max(0, Math.round((collected / target) * 100)));
}