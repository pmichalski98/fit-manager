import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NutritionInsight } from "@/server/db/schema";
import { GenerateInsightButton } from "./generate-insight-button";

interface WeeklyInsightCardProps {
  weekStart: string;
  weekEnd: string;
  insight: NutritionInsight | null;
  hasMeals: boolean;
}

export function WeeklyInsightCard({
  weekStart,
  weekEnd,
  insight,
  hasMeals,
}: WeeklyInsightCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analiza tygodnia</CardTitle>
        <CardDescription>
          {weekStart} — {weekEnd}
          {insight ? ` · ${insight.model}` : ""}
        </CardDescription>
        {hasMeals && (
          <CardAction>
            <GenerateInsightButton
              weekStart={weekStart}
              hasInsight={insight !== null}
            />
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {!insight && (
          <p className="text-muted-foreground text-sm">
            {hasMeals
              ? "Ten tydzień nie został jeszcze przeanalizowany."
              : "Brak zsynchronizowanych posiłków w tym tygodniu."}
          </p>
        )}

        {insight && (
          <>
            <p className="text-sm leading-relaxed">{insight.summary}</p>

            {insight.observations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Spostrzeżenia</h3>
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  {insight.observations.map((observation, index) => (
                    <li key={index}>{observation}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.swaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Proponowane zamienniki</h3>
                <ul className="space-y-3">
                  {insight.swaps.map((swap, index) => (
                    <li key={index} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{swap.from}</span>
                        <ArrowRightIcon className="text-muted-foreground size-4" />
                        <span className="font-medium">{swap.to}</span>
                        {swap.kcalSaved !== null && (
                          <Badge variant="secondary">
                            −{Math.round(swap.kcalSaved)} kcal
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {swap.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
