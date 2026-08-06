import { format } from "date-fns";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { measurementsRepository } from "@/modules/body/repositories";
import { MeasurementsDialog } from "@/modules/body/ui/components/measurements-dialog";
import type { BodyMeasurement } from "@/server/db/schema";

const MEASUREMENT_FIELDS = [
  { name: "neck", label: "Neck" },
  { name: "chest", label: "Chest" },
  { name: "waist", label: "Waist" },
  { name: "bellybutton", label: "Belly" },
  { name: "hips", label: "Hips" },
  { name: "biceps", label: "Biceps" },
  { name: "thigh", label: "Thigh" },
] as const;

type FieldName = (typeof MEASUREMENT_FIELDS)[number]["name"];

function parseValue(row: BodyMeasurement, field: FieldName): number | null {
  const raw = row[field];
  if (raw == null || raw === "") return null;
  const num = parseFloat(raw);
  return Number.isNaN(num) ? null : num;
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) =>
    values.length === 1 ? 58 : 2 + 56 * (i / (values.length - 1));
  const y = (v: number) => 15 - 12 * ((v - min) / span);

  const points = values
    .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const lastX = x(values.length - 1).toFixed(1);
  const lastY = y(values[values.length - 1]!).toFixed(1);

  return (
    <svg viewBox="0 0 60 18" className="h-[18px] w-[60px] shrink-0">
      {values.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={1.5}
        />
      )}
      <circle cx={lastX} cy={lastY} r={2} fill="var(--chart-1)" />
    </svg>
  );
}

export async function MeasurementsCard() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) return null;

  const history = await measurementsRepository.findRecentMeasurements(
    userId,
    3,
  );
  const latest = history[history.length - 1] ?? null;
  const oldest = history[0] ?? null;

  const rows = MEASUREMENT_FIELDS.map(({ name, label }) => {
    const values = history
      .map((row) => parseValue(row, name))
      .filter((v): v is number => v != null);
    const current = values[values.length - 1] ?? null;
    const delta =
      values.length > 1
        ? Math.round((values[values.length - 1]! - values[0]!) * 10) / 10
        : null;
    return { name, label, values, current, delta };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>
          Body measurements
          {latest ? (
            <span className="text-faint ml-1.5 font-mono text-[11px] font-semibold tracking-normal normal-case">
              last {format(new Date(latest.date), "d MMM")}
            </span>
          ) : null}
        </CardTitle>
        <MeasurementsDialog last={latest}>
          <Button variant="outline" size="xs">
            Update
          </Button>
        </MeasurementsDialog>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground py-3 font-mono text-xs">
            No measurements yet — record your first ones.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-2">
            {rows.map((row) => (
              <div
                key={row.name}
                className="border-border/60 flex items-center gap-3 border-b py-1.5"
              >
                <span className="label-caps w-16 shrink-0 tracking-[0.08em]">
                  {row.label}
                </span>
                {row.values.length > 0 ? (
                  <Sparkline values={row.values} />
                ) : (
                  <span className="h-[18px] w-[60px] shrink-0" />
                )}
                <span className="ml-auto shrink-0 font-mono text-[13px] font-semibold">
                  {row.current != null ? row.current : "—"}
                  <span className="text-faint text-[10px]"> cm</span>
                </span>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right font-mono text-[11px]",
                    row.delta != null && row.delta !== 0
                      ? "text-primary"
                      : "text-faint",
                  )}
                >
                  {row.delta != null
                    ? `${row.delta > 0 ? "▲ +" : row.delta < 0 ? "▼ " : ""}${row.delta}`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
        {oldest && history.length > 1 ? (
          <p className="text-faint mt-3.5 font-mono text-[10px]">
            Δ = change since {format(new Date(oldest.date), "d MMM")} (
            {history.length} measurements) · trend from recent entries
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MeasurementsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-7 w-16" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="border-border/60 flex items-center border-b py-1.5"
            >
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
