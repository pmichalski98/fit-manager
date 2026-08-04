import { cn } from "@/lib/utils";

function initialsOf(seed: string): string {
  const parts = seed.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second =
    parts.length > 1
      ? (parts[parts.length - 1]?.charAt(0) ?? "")
      : (parts[0]?.charAt(1) ?? "");
  return `${first}${second}`.toUpperCase();
}

/** Carbon avatar: lime initials on a secondary square, radius 6px. */
export function InitialsAvatar({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-secondary text-primary flex size-[30px] shrink-0 items-center justify-center rounded-sm text-[11px] font-bold",
        className,
      )}
    >
      {initialsOf(seed)}
    </span>
  );
}
