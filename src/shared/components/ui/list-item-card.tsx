import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

interface ListItemCardProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Mobile list card pattern (nusaqu / bhisa inspired):
 * icon on the left, title + subtitle in the middle, chevron on the right.
 */
export function ListItemCard({
  icon: Icon,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: ListItemCardProps) {
  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={cn("flex items-center gap-3 p-4", className)}
    >
      {Icon ? (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ?? (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </Card>
  );
}
