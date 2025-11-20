"use client";

import Image from "next/image";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Photo } from "@/modules/photo/types";
import { formatWeight } from "@/modules/photo/utils";

type PhotoComparisonProps = {
  selectedPhotos: Photo[];
};

export function PhotoComparison({ selectedPhotos }: PhotoComparisonProps) {
  const [firstSelected, secondSelected] = selectedPhotos;

  const weightDifferenceText = useMemo(() => {
    if (!firstSelected?.weight || !secondSelected?.weight) return null;

    const a = Number.parseFloat(firstSelected.weight);
    const b = Number.parseFloat(secondSelected.weight);

    if (Number.isNaN(a) || Number.isNaN(b)) return null;

    const diff = b - a;
    const sign = diff > 0 ? "+" : diff < 0 ? "" : "";

    return `${sign}${diff.toFixed(1)} kg difference between these photos`;
  }, [firstSelected?.weight, secondSelected?.weight]);

  return (
    <div className="space-y-4">
      <Dialog>
        <div className="space-y-2">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Progress comparison
                </h2>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={selectedPhotos.length < 2}
                    className="whitespace-nowrap"
                  >
                    Compare fullscreen
                  </Button>
                </DialogTrigger>
              </div>
              <p className="text-muted-foreground text-sm">
                Select any two photos below to compare how your physique and
                weight changed over time.
              </p>
            </div>
          </div>
        </div>

        <DialogTrigger asChild disabled={selectedPhotos.length < 2}>
          <button
            type="button"
            className="bg-muted focus-visible:ring-primary relative flex w-full overflow-hidden rounded-lg border text-left transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Open fullscreen comparison"
          >
            {[firstSelected, secondSelected].map((photo, index) => (
              <div
                key={photo?.id ?? index}
                className="relative aspect-[3/4] w-1/2"
              >
                {photo ? (
                  <Image
                    src={photo.imageUrl}
                    alt={`Progress photo from ${photo.date}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    Select a photo below
                  </div>
                )}
                <div className="bg-background/70 text-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm">
                  {index === 0 ? "Photo A" : "Photo B"}
                </div>
                {photo && (
                  <div className="bg-background/80 absolute inset-x-0 bottom-0 px-3 py-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{photo.date}</span>
                      <span className="text-muted-foreground">
                        {formatWeight(photo.weight)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Fullscreen comparison</DialogTitle>
            <DialogDescription>
              You&apos;re viewing your selected progress photos side by side.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="bg-muted relative flex w-full overflow-hidden rounded-lg border">
              {[firstSelected, secondSelected].map((photo, index) => (
                <div
                  key={photo?.id ?? index}
                  className="relative aspect-[3/4] w-1/2"
                >
                  {photo ? (
                    <Image
                      src={photo.imageUrl}
                      alt={`Progress photo from ${photo.date}`}
                      fill
                      sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                      Select a photo to compare
                    </div>
                  )}
                  <div className="bg-background/70 text-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm">
                    {index === 0 ? "Photo A" : "Photo B"}
                  </div>
                  {photo && (
                    <div className="bg-background/80 absolute inset-x-0 bottom-0 px-3 py-2 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{photo.date}</span>
                        <span className="text-muted-foreground">
                          {formatWeight(photo.weight)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {weightDifferenceText && (
            <p className="text-muted-foreground mt-4 text-sm">
              {weightDifferenceText}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {weightDifferenceText && (
        <p className="text-muted-foreground text-sm">{weightDifferenceText}</p>
      )}
    </div>
  );
}
