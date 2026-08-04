import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export const TrainingsSkeleton = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card flex flex-col rounded-[10px] border">
            <div className="space-y-2 px-[18px] pt-4 pb-3">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="space-y-2 border-t px-[18px] py-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-3.5 w-full" />
              ))}
            </div>
            <div className="flex gap-2 border-t px-[18px] py-3">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
