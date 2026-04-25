"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

// Avoid hydration mismatch without running setState inside an effect:
// useSyncExternalStore returns the server snapshot on SSR and the client
// snapshot after hydration — we flip the icon only on the client.
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent transition-colors",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </button>
  );
}
