"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "fit-manager-hidden-charts";

export const PROGRESS_CHARTS = [
  { id: "training-activity", title: "Training Activity" },
  { id: "weight-history", title: "Weight History" },
  { id: "kcal-history", title: "Caloric Intake History" },
  { id: "steps-history", title: "Steps History" },
  { id: "macro-history", title: "Macros History" },
  { id: "exercise-progress", title: "Exercise Progress" },
  { id: "training-volume", title: "Training Volume" },
] as const;

type ChartVisibilityContextValue = {
  hiddenIds: string[] | null; // null until mounted (SSR renders everything)
  toggle: (chartId: string) => void;
};

const ChartVisibilityContext = createContext<ChartVisibilityContextValue>({
  hiddenIds: null,
  toggle: () => undefined,
});

function readHidden(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function ChartVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenIds, setHiddenIds] = useState<string[] | null>(null);

  useEffect(() => {
    setHiddenIds(readHidden());
  }, []);

  const toggle = (chartId: string) => {
    setHiddenIds((prev) => {
      const ids = prev ?? [];
      const next = ids.includes(chartId)
        ? ids.filter((id) => id !== chartId)
        : [...ids, chartId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <ChartVisibilityContext.Provider value={{ hiddenIds, toggle }}>
      {children}
    </ChartVisibilityContext.Provider>
  );
}

export function ChartsMenu() {
  const { hiddenIds, toggle } = useContext(ChartVisibilityContext);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="size-4" />
          Charts
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Visible charts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROGRESS_CHARTS.map((chart) => (
          <DropdownMenuCheckboxItem
            key={chart.id}
            checked={!hiddenIds?.includes(chart.id)}
            onCheckedChange={() => toggle(chart.id)}
            // Keep the menu open while toggling several charts
            onSelect={(e) => e.preventDefault()}
          >
            {chart.title}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HideableChart({
  chartId,
  children,
}: {
  chartId: string;
  children: ReactNode;
}) {
  const { hiddenIds } = useContext(ChartVisibilityContext);

  if (hiddenIds?.includes(chartId)) return null;
  return <>{children}</>;
}
