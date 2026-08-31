import type { NutritionInsight } from "@/server/db/schema";
import { AutoAnalysisToggle } from "./auto-analysis-toggle";
import { GenerateInsightButton } from "./generate-insight-button";

interface WeeklyInsightCardProps {
  weekStart: string;
  insight: NutritionInsight | null;
  hasMeals: boolean;
  autoAnalysis: boolean;
}

export function WeeklyInsightCard({
  weekStart,
  insight,
  hasMeals,
  autoAnalysis,
}: WeeklyInsightCardProps) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-[10px] border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-marker text-[11px] font-semibold tracking-[0.1em] uppercase">
          Analiza tygodnia{" "}
          {insight && (
            <span className="text-faint font-mono font-normal tracking-normal normal-case">
              {insight.model}
            </span>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <AutoAnalysisToggle enabled={autoAnalysis} />
          {hasMeals && (
            <GenerateInsightButton
              weekStart={weekStart}
              hasInsight={insight !== null}
              insightUpdatedAt={insight?.updatedAt.toISOString() ?? null}
            />
          )}
        </div>
      </div>

      {!insight && (
        <p className="text-muted-foreground text-xs">
          {hasMeals
            ? "Ten tydzień nie został jeszcze przeanalizowany."
            : "Brak zsynchronizowanych posiłków w tym tygodniu."}
        </p>
      )}

      {insight && (
        <>
          <p className="max-w-[720px] text-[13px] leading-relaxed">
            {insight.summary}
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {insight.observations.length > 0 && (
              <div className="space-y-2">
                <h3 className="label-caps">Spostrzeżenia</h3>
                <ul className="text-secondary-foreground list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                  {insight.observations.map((observation, index) => (
                    <li key={index}>{observation}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.swaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="label-caps">Proponowane zamienniki</h3>
                <ul className="space-y-2">
                  {insight.swaps.map((swap, index) => (
                    <li
                      key={index}
                      className="bg-input-bg rounded-sm border px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold">{swap.from}</span>
                        <span className="text-faint">→</span>
                        <span className="font-semibold">{swap.to}</span>
                        {swap.kcalSaved !== null && (
                          <span className="bg-primary/10 text-primary rounded-[4px] px-1.5 py-px font-mono text-[10px]">
                            −{Math.round(swap.kcalSaved)} kcal
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {swap.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
