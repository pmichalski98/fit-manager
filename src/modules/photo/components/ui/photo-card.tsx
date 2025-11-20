"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Photo } from "@/modules/photo/types";
import { formatWeight } from "@/modules/photo/utils";

type PhotoCardProps = {
  photo: Photo;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PhotoCard({
  photo,
  selected,
  onToggleSelect,
  onDelete,
}: PhotoCardProps) {
  return (
    <div
      className={cn(
        "group bg-card focus-within:ring-primary relative flex flex-col overflow-hidden rounded-lg border text-left transition focus-within:ring-2 focus-within:outline-none hover:shadow-md",
        selected &&
          "border-primary ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleSelect(photo.id)}
        className="bg-muted relative aspect-[3/4] w-full overflow-hidden"
      >
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
      </button>
      <div className="flex items-center justify-between p-2">
        <div className="space-y-0.5">
          <p className="text-sm leading-tight font-medium">{photo.date}</p>
          <p className="text-muted-foreground text-xs">
            {formatWeight(photo.weight)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          onClick={() => onDelete(photo.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete photo</span>
        </Button>
      </div>
    </div>
  );
}
