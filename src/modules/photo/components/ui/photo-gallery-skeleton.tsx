import { Skeleton } from "@/components/ui/skeleton";

export function PhotoGallerySkeleton() {
  return (
    <div className="space-y-8">
      {/* Comparison Section Skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-40" />
              </div>
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </div>
        </div>

        {/* Comparison Box Skeleton */}
        <div className="bg-muted/50 flex w-full overflow-hidden rounded-lg border">
          <div className="relative aspect-3/4 w-1/2 border-r p-4">
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="relative aspect-3/4 w-1/2 p-4">
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        <Skeleton className="h-4 w-48" />
      </div>

      {/* Grid Section Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="hidden h-4 w-64 sm:block" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-card flex flex-col overflow-hidden rounded-lg border shadow-sm"
            >
              <div className="bg-muted aspect-3/4 w-full animate-pulse" />
              <div className="flex items-center justify-between p-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
