"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Delta = "up" | "down" | "equal" | "neutral";

interface NumberStepperProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label: string;
  previousValue?: number;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
}

function compare(
  current: number | null | undefined,
  previous: number | undefined,
): Delta {
  if (previous == null || current == null) return "neutral";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "equal";
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  disabled = false,
  label,
  previousValue,
  placeholder,
  inputMode = "numeric",
}: NumberStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numericValue = typeof value === "number" ? value : null;
  const delta = compare(numericValue, previousValue);

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  );

  const adjust = useCallback(
    (direction: 1 | -1) => {
      const base = numericValue ?? 0;
      const next = clamp(
        Math.round((base + direction * step) * 100) / 100,
      );
      onChange(next);
    },
    [numericValue, step, clamp, onChange],
  );

  const adjustRef = useRef(adjust);
  adjustRef.current = adjust;

  const startHold = useCallback(
    (direction: 1 | -1) => {
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(
          () => adjustRef.current(direction),
          100,
        );
      }, 300);
    },
    [],
  );

  const stopHold = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopHold();
  }, [stopHold]);

  const handleValueClick = () => {
    if (disabled) return;
    setEditValue(numericValue != null ? String(numericValue) : "");
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (editValue === "") {
      onChange(null);
      return;
    }
    const parsed = Number(editValue);
    if (Number.isNaN(parsed)) return;
    onChange(clamp(parsed));
  };

  const displayValue =
    numericValue != null
      ? Number.isInteger(numericValue)
        ? String(numericValue)
        : numericValue.toFixed(1)
      : placeholder ?? "—";

  const atMin = numericValue != null && numericValue <= min;
  const atMax = numericValue != null && numericValue >= max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
        {previousValue != null && (
          <span
            className={cn(
              "text-[10px] tabular-nums",
              delta === "up"
                ? "text-emerald-500"
                : delta === "down"
                  ? "text-rose-400"
                  : "text-muted-foreground/60",
            )}
          >
            prev {previousValue === 0 && label === "Weight" ? "BW" : previousValue}
          </span>
        )}
      </div>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-xl transition-all",
          delta === "up"
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
            : delta === "down"
              ? "bg-rose-500/10 ring-1 ring-rose-500/30"
              : "bg-muted/60 dark:bg-muted/40 ring-1 ring-border",
          disabled && "opacity-40",
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || atMin}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors active:bg-primary/20 active:text-primary disabled:pointer-events-none disabled:opacity-30"
          onClick={() => adjust(-1)}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          tabIndex={-1}
        >
          <Minus className="h-4 w-4" />
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode={inputMode}
            step={step}
            min={min}
            max={max}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEdit();
              }
            }}
            className="h-11 min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular-nums outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={handleValueClick}
            disabled={disabled}
            className={cn(
              "h-11 min-w-0 flex-1 text-center text-base font-semibold tabular-nums transition-colors",
              numericValue == null && "text-muted-foreground",
            )}
            tabIndex={-1}
          >
            {displayValue}
          </button>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled || atMax}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors active:bg-primary/20 active:text-primary disabled:pointer-events-none disabled:opacity-30"
          onClick={() => adjust(1)}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          tabIndex={-1}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
