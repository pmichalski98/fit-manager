import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export const TrainingsSkeleton = () => {
  return (
    <>
      <Card className="flex flex-col gap-4 px-4 py-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
      </Card>
      <Card className="flex flex-col gap-4 px-4 py-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-3/4" />
      </Card>
    </>
  );
};
