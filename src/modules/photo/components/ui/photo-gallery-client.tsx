"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  date: string;
  weight: string | null;
  imageUrl: string;
};

type PhotoGalleryClientProps = {
  photos: Photo[];
};

function formatWeight(weight: string | null) {
  if (!weight) return "No weight logged";

  const numeric = Number.parseFloat(weight);
  if (Number.isNaN(numeric)) return `${weight}`;

  return `${numeric} kg`;
}

export default function PhotoGalleryClient({
  photos,
}: PhotoGalleryClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    photos.slice(0, 2).map((photo) => photo.id),
  );

  const selectedPhotos = useMemo(
    () =>
      selectedIds
        .map((id) => photos.find((photo) => photo.id === id) ?? null)
        .filter((photo): photo is Photo => photo !== null),
    [photos, selectedIds],
  );

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev): string[] => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      if (prev.length < 2) {
        return [...prev, id];
      }

      const second = prev[1]!;
      return [second, id];
    });
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Progress comparison
            </h2>
            <p className="text-muted-foreground text-sm">
              Select any two photos below to compare how your physique and
              weight changed over time.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={selectedPhotos.length < 2}
                className="whitespace-nowrap"
              >
                Compare fullscreen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Fullscreen comparison</DialogTitle>
                <DialogDescription>
                  You&apos;re viewing your selected progress photos side by
                  side.
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
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[firstSelected, secondSelected].map((photo, index) => (
                    <div
                      key={photo?.id ?? index}
                      className="bg-card rounded-lg border p-4 text-sm"
                    >
                      <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                        {index === 0 ? "Photo A" : "Photo B"}
                      </div>
                      {photo ? (
                        <div className="space-y-1">
                          <div className="font-medium">{photo.date}</div>
                          <div className="text-muted-foreground">
                            {formatWeight(photo.weight)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          Select a photo to compare.
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
        </div>

        <div className="space-y-3">
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
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[firstSelected, secondSelected].map((photo, index) => (
              <div
                key={photo?.id ?? index}
                className="bg-card rounded-lg border p-4 text-sm"
              >
                <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  {index === 0 ? "Photo A (earlier)" : "Photo B (later)"}
                </div>
                {photo ? (
                  <div className="space-y-1">
                    <div className="font-medium">{photo.date}</div>
                    <div className="text-muted-foreground">
                      {formatWeight(photo.weight)}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Select a photo below.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {weightDifferenceText && (
          <p className="text-muted-foreground text-sm">
            {weightDifferenceText}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight">
            All progress photos
          </h3>
          <p className="text-muted-foreground text-xs">
            Click any photo to select or deselect it for comparison.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => {
            const selected = isSelected(photo.id);

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => handleToggleSelect(photo.id)}
                className={cn(
                  "group bg-card focus-visible:ring-primary flex flex-col overflow-hidden rounded-lg border text-left transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none",
                  selected &&
                    "border-primary ring-primary ring-offset-background ring-2 ring-offset-2",
                )}
              >
                <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={photo.imageUrl}
                    alt={`Progress photo from ${photo.date}`}
                    fill
                    sizes="160px"
                    className="object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                  {selected && (
                    <div className="pointer-events-none absolute inset-0 bg-black/20" />
                  )}
                  {selected && (
                    <div className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm">
                      Selected
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="text-sm leading-tight font-medium">
                    {photo.date}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatWeight(photo.weight)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
