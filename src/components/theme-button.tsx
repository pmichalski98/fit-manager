"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = React.useCallback(() => {
    const themes: Array<"light" | "dark"> = ["light", "dark"];
    const currentTheme = (theme as "light" | "dark") ?? "dark";
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    setTheme(nextTheme as string);
  }, [theme, setTheme]);

  return (
    <Button variant="ghost" size="icon" onClick={handleToggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
