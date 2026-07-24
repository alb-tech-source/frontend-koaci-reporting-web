"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { cn } from "@/shared/lib/utils";

import type { PerformancePoint } from "./types";

const chartConfig = {
  investasi: { label: "Investasi Masuk (Rp Jt)", color: "var(--brand)" },
  return: { label: "Return (Rp Jt)", color: "var(--accent-teal)" },
} satisfies ChartConfig;

interface PerformanceChartProps {
  data: PerformancePoint[];
  title?: string;
  description?: string;
}

export function PerformanceChart({
  data,
  title = "Statistik Performa Investasi",
  description = "Investasi masuk vs. return 12 bulan terakhir (dalam juta rupiah).",
}: Readonly<PerformanceChartProps>) {
  const [mode, setMode] = useState<"line" | "bar">("line");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-md px-3 text-xs",
              mode === "line" && "bg-brand/10 text-brand hover:bg-brand/10",
            )}
            onClick={() => setMode("line")}
          >
            Line
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-md px-3 text-xs",
              mode === "bar" && "bg-brand/10 text-brand hover:bg-brand/10",
            )}
            onClick={() => setMode("bar")}
          >
            Bar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {mode === "line" ? (
              <AreaChart
                data={data}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fillInvestasi"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-investasi)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-investasi)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="fillReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-return)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-return)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="investasi"
                  type="monotone"
                  stroke="var(--color-investasi)"
                  strokeWidth={2}
                  fill="url(#fillInvestasi)"
                />
                <Area
                  dataKey="return"
                  type="monotone"
                  stroke="var(--color-return)"
                  strokeWidth={2}
                  fill="url(#fillReturn)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar
                  dataKey="investasi"
                  fill="var(--color-investasi)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="return"
                  fill="var(--color-return)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <LegendDot color="var(--brand)" label="Investasi Masuk" />
          <LegendDot color="var(--accent-teal)" label="Return" />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: Readonly<{ color: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
