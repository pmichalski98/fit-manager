import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toFixed1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export function formatDateYYYYMMDD(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function getTodayDateYYYYMMDD() {
  return formatDateYYYYMMDD(new Date());
}

export const handleIntegerInput = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  if (event.key === "." || event.key === ",") {
    event.preventDefault();
  }
};
