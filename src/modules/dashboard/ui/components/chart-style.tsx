import { format, parseISO } from "date-fns";

// Shared Carbon look for Recharts: mono faint axis labels, solid horizontal
// gridlines in the dedicated --grid color, no vertical grid.

export const AXIS_TICK = {
  fill: "var(--faint)",
  fontSize: 11,
  fontFamily: "var(--font-plex-mono), monospace",
} as const;

export const GRID_STROKE = "var(--grid)";

export const CHART_ASPECT = "aspect-video w-full sm:aspect-[2.2/1]";

export function formatDateTick(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

export function formatTooltipDate(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

type DotProps = {
  key?: string;
  cx?: number;
  cy?: number;
  index?: number;
};

// Recharts `dot` renderer that only draws the newest point: a 4px accent dot
// with a panel-colored ring, per the Carbon chart spec
export function makeLastPointDot(lastIndex: number) {
  return function LastPointDot({ key, cx, cy, index }: DotProps) {
    if (index !== lastIndex || cx == null || cy == null) {
      return <g key={key} />;
    }
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--chart-1)"
        stroke="var(--card)"
        strokeWidth={2}
      />
    );
  };
}
