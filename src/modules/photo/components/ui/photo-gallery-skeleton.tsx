import { Skeleton } from "@/components/ui/skeleton";

export function PhotoGallerySkeleton() {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,560px)_1fr]">
      {/* Comparison card */}
      <div className="bg-card flex flex-col gap-3.5 rounded-[10px] border p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-[30px] w-24" />
        </div>
        <div className="flex w-full overflow-hidden rounded-lg border">
          <div className="bg-input-bg relative aspect-[3/4] w-1/2 animate-pulse border-r" />
          <div className="bg-input-bg relative aspect-[3/4] w-1/2 animate-pulse" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Gallery card */}
      <div className="bg-card flex flex-col gap-3.5 rounded-[10px] border p-5">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-3.5 w-56 sm:block" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-input-bg flex flex-col overflow-hidden rounded-lg border"
            >
              <div className="bg-background aspect-[3/4] w-full animate-pulse" />
              <div className="flex items-center justify-between px-2.5 py-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
                <Skeleton className="size-[26px] rounded-[4px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
