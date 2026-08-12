"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  );

  const adjust = useCallback(
    (direction: 1 | -1) => {
      const base = numericValue ?? 0;
      const next = clamp(Math.round((base + direction * step) * 100) / 100);
      onChange(next);
    },
    [numericValue, step, clamp, onChange],
  );

  const adjustRef = useRef(adjust);
  adjustRef.current = adjust;

  const startHold = useCallback((direction: 1 | -1) => {
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(
        () => adjustRef.current(direction),
        100,
      );
    }, 300);
  }, []);

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
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (editValue === "") {
      onChange(null);
      return;
    }
    const parsed = Number(editValue.replace(",", "."));
    if (Number.isNaN(parsed)) return;
    onChange(clamp(parsed));
  };

  const displayValue =
    numericValue != null
      ? Number.isInteger(numericValue)
        ? String(numericValue)
        : numericValue.toFixed(1)
      : (placeholder ?? "—");

  const atMin = numericValue != null && numericValue <= min;
  const atMax = numericValue != null && numericValue >= max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[9px] font-semibold tracking-[0.1em] uppercase">
          {label}
        </span>
        {previousValue != null && (
          <span className="text-faint font-mono text-[10px]">
            prev{" "}
            {previousValue === 0 && label === "Weight" ? "BW" : previousValue}
          </span>
        )}
      </div>
      <div
        className={cn(
          "bg-background ring-border flex items-center overflow-hidden rounded-lg ring-1 transition-all ring-inset",
          disabled && "opacity-45",
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled || atMin}
          className="text-muted-foreground active:bg-primary/20 active:text-primary flex h-11 w-11 shrink-0 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
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
            // type="text": iOS ignores the "," key on type="number" inputs,
            // which makes fractional weights impossible to type
            type="text"
            inputMode={inputMode}
            value={editValue}
            onChange={(e) =>
              setEditValue(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEdit();
              }
            }}
            className="h-11 min-w-0 flex-1 bg-transparent text-center font-mono text-base font-semibold outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={handleValueClick}
            onFocus={handleValueClick}
            disabled={disabled}
            className={cn(
              "h-11 min-w-0 flex-1 text-center font-mono text-base font-semibold transition-colors",
              numericValue == null && "text-muted-foreground",
            )}
          >
            {displayValue}
          </button>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled || atMax}
          className="text-muted-foreground active:bg-primary/20 active:text-primary flex h-11 w-11 shrink-0 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
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
