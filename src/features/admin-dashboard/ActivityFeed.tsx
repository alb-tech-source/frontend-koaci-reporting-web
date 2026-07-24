import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

import type { ActivityItem } from "./types";
import { activityMeta, formatRelativeTime, toneBg } from "./utils";

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  description?: string;
}

export function ActivityFeed({
  items,
  title = "Ringkasan Aktivitas Sistem",
  description = "5 aktivitas terbaru pada platform.",
}: Readonly<ActivityFeedProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const meta = activityMeta[item.kind];
            const Icon = meta.icon;
            return (
              <li key={item.id} className="flex items-start gap-3 px-6 py-4">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    toneBg[meta.tone],
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
          {items.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-muted-foreground">
              Belum ada aktivitas.
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
