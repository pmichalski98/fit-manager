"use client";

import Image from "next/image";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Photo } from "@/modules/photo/types";
import { formatPhotoDate, formatWeight } from "@/modules/photo/utils";

type PhotoComparisonProps = {
  selectedPhotos: Photo[];
};

function ComparisonPanes({
  photos,
  sizes,
}: {
  photos: [Photo | undefined, Photo | undefined];
  sizes: string;
}) {
  return (
    <div className="flex w-full overflow-hidden rounded-lg border">
      {photos.map((photo, index) => (
        <div
          key={photo?.id ?? index}
          className={cn(
            "bg-input-bg relative aspect-[3/4] w-1/2",
            index === 0 && "border-r",
          )}
        >
          {photo ? (
            <Image
              src={photo.imageUrl}
              alt={`Progress photo from ${photo.date}`}
              fill
              sizes={sizes}
              className="object-cover"
            />
          ) : (
            <div className="text-faint flex h-full items-center justify-center text-xs">
              Select a photo
            </div>
          )}
          <span
            className={cn(
              "bg-background absolute top-2 left-2 rounded-[4px] border px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase",
              index === 0
                ? "border-input text-secondary-foreground"
                : "border-primary text-primary",
            )}
          >
            {index === 0 ? "A" : "B"}
          </span>
          {photo && (
            <div className="bg-background/85 absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 font-mono">
              <span className="text-xs font-semibold">
                {formatPhotoDate(photo.date)}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {formatWeight(photo.weight)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ComparisonDeltas({
  first,
  second,
}: {
  first: Photo | undefined;
  second: Photo | undefined;
}) {
  const weightDelta = useMemo(() => {
    if (!first?.weight || !second?.weight) return null;
    const a = Number.parseFloat(first.weight);
    const b = Number.parseFloat(second.weight);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return b - a;
  }, [first?.weight, second?.weight]);

  const daysDelta = useMemo(() => {
    if (!first || !second) return null;
    const ms = new Date(second.date).getTime() - new Date(first.date).getTime();
    if (Number.isNaN(ms)) return null;
    return Math.round(Math.abs(ms) / 86_400_000);
  }, [first, second]);

  if (weightDelta == null && daysDelta == null) return null;

  return (
    <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]">
      {weightDelta != null && (
        <span>
          Δ WEIGHT{" "}
          <span
            className={cn(
              weightDelta < 0
                ? "text-primary"
                : weightDelta > 0
                  ? "text-cardio"
                  : "text-foreground",
            )}
          >
            {weightDelta < 0 ? "▼ " : weightDelta > 0 ? "▲ " : ""}
            {Math.abs(weightDelta).toFixed(1)} kg
          </span>
        </span>
      )}
      {daysDelta != null && (
        <span>
          Δ TIME <span className="text-foreground">{daysDelta} days</span>
        </span>
      )}
    </div>
  );
}

export function PhotoComparison({ selectedPhotos }: PhotoComparisonProps) {
  const [firstSelected, secondSelected] = selectedPhotos;
  const canCompare = selectedPhotos.length >= 2;

  return (
    <div className="bg-card flex flex-col gap-3.5 rounded-[10px] border p-5">
      <Dialog>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase">
            Comparison
          </h3>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!canCompare}>
              Fullscreen
            </Button>
          </DialogTrigger>
        </div>

        <DialogTrigger asChild disabled={!canCompare}>
          <button
            type="button"
            className="focus-visible:border-primary rounded-lg text-left outline-none"
            aria-label="Open fullscreen comparison"
          >
            <ComparisonPanes
              photos={[firstSelected, secondSelected]}
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 100vw"
            />
          </button>
        </DialogTrigger>

        <ComparisonDeltas first={firstSelected} second={secondSelected} />

        <DialogContent className="gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-[18px]">
            <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
              Fullscreen comparison
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3.5 p-5">
            <ComparisonPanes
              photos={[firstSelected, secondSelected]}
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
            />
            <ComparisonDeltas first={firstSelected} second={secondSelected} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
