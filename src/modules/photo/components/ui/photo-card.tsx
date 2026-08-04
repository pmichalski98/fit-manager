"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Photo } from "@/modules/photo/types";
import { formatPhotoDate, formatWeight } from "@/modules/photo/utils";

type PhotoCardProps = {
  photo: Photo;
  selectionTag: "A" | "B" | null;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PhotoCard({
  photo,
  selectionTag,
  onToggleSelect,
  onDelete,
}: PhotoCardProps) {
  return (
    <div
      className={cn(
        "group bg-input-bg hover:border-primary relative flex flex-col overflow-hidden rounded-lg border transition-colors",
        selectionTag && "border-primary",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleSelect(photo.id)}
        className="bg-background relative aspect-[3/4] w-full overflow-hidden"
      >
        <Image
          src={photo.imageUrl}
          alt={`Progress photo from ${photo.date}`}
          fill
          sizes="160px"
          className="object-cover"
        />
        {selectionTag && (
          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 rounded-[4px] px-[7px] py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase">
            {selectionTag}
          </span>
        )}
      </button>
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-2 font-mono">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold">
            {formatPhotoDate(photo.date)}
          </p>
          <p className="text-muted-foreground text-[10px]">
            {formatWeight(photo.weight)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(photo.id)}
          className="text-faint hover:text-destructive flex size-[26px] shrink-0 items-center justify-center rounded-[4px] transition-colors"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete photo</span>
        </button>
      </div>
    </div>
  );
}
