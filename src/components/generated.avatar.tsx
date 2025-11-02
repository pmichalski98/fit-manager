import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { cn } from "@/lib/utils";

interface GeneratedAvatarProps {
  seed: string;
  className?: string;
}

export default function GeneratedAvatar({
  seed,
  className,
}: GeneratedAvatarProps) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage
        src={createAvatar(initials, {
          seed,
          fontWeight: 500,
          fontSize: 42,
        }).toDataUri()}
      />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
