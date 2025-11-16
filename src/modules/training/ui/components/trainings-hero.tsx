export function TrainingsHero({
  trainingsLength,
}: {
  trainingsLength: number;
}) {
  return (
    <section className="border-border/60 from-primary/10 rounded-3xl border bg-linear-to-br to-transparent p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-foreground text-sm font-semibold">
          Training library
        </p>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Every training template you have created lives here. Start a session
          from the list below or keep refining them so your next workout stays
          purposeful.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-widest uppercase">
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1">
            {trainingsLength} template{trainingsLength === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </section>
  );
}
